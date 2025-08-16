
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  Trophy, 
  Target, 
  Clock,
  TrendingUp,
  Award,
  Star,
  Calendar
} from 'lucide-react';
import { format, subDays } from 'date-fns';

const PERFORMANCE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function EmployeePerformanceDashboard({ leads, opportunities, quotes, users, currency }) {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [employeeStats, setEmployeeStats] = useState([]);
  const [teamMetrics, setTeamMetrics] = useState({});
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    if (leads && opportunities && quotes && users) {
      calculateEmployeePerformance();
      calculateTeamMetrics();
      preparePerformanceChart();
    }
  }, [leads, opportunities, quotes, users, selectedPeriod]);

  const getFilteredData = (data) => {
    if (!selectedPeriod || selectedPeriod === 'all') return data;
    const daysAgo = parseInt(selectedPeriod);
    const cutoffDate = subDays(new Date(), daysAgo);
    return data.filter(item => new Date(item.created_date) >= cutoffDate);
  };

  const calculateEmployeePerformance = () => {
    const filteredLeads = getFilteredData(leads);
    const filteredOpps = getFilteredData(opportunities);
    const filteredQuotes = getFilteredData(quotes);

    const salesUsers = users.filter(user => 
      user.roles?.some(role => ['sales', 'sales_manager'].includes(role)) ||
      user.department_id === 'sales' ||
      filteredLeads.some(lead => lead.assigned_to === user.id)
    );

    const stats = salesUsers.map(user => {
      const userLeads = filteredLeads.filter(lead => 
        lead.assigned_to === user.id || lead.created_by === user.email
      );
      const userOpps = filteredOpps.filter(opp => 
        opp.owner_id === user.id || opp.created_by === user.email
      );
      const userQuotes = filteredQuotes.filter(quote => 
        quote.creator_user_id === user.id || quote.created_by === user.email
      );

      const wonOpps = userOpps.filter(opp => opp.stage === 'closed_won');
      const totalRevenue = wonOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);
      const winRate = userOpps.length > 0 ? (wonOpps.length / userOpps.length * 100) : 0;

      // Calculate average deal size
      const avgDealSize = wonOpps.length > 0 ? totalRevenue / wonOpps.length : 0;

      // Calculate average sales cycle for this user
      const completedOpps = userOpps.filter(opp => ['closed_won', 'closed_lost'].includes(opp.stage));
      const avgSalesCycle = completedOpps.length > 0 
        ? completedOpps.reduce((sum, opp) => {
            const start = new Date(opp.created_date);
            const end = new Date(opp.updated_date);
            return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          }, 0) / completedOpps.length
        : 0;

      return {
        user,
        leadsCount: userLeads.length,
        opportunitiesCount: userOpps.length,
        quotesCount: userQuotes.length,
        wonDeals: wonOpps.length,
        totalRevenue,
        winRate,
        avgDealSize,
        avgSalesCycle,
        pipelineValue: userOpps.filter(opp => !['closed_won', 'closed_lost'].includes(opp.stage))
          .reduce((sum, opp) => sum + (opp.amount || 0), 0)
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    setEmployeeStats(stats);
  };

  const calculateTeamMetrics = () => {
    const totalRevenue = employeeStats.reduce((sum, emp) => sum + emp.totalRevenue, 0);
    const totalDeals = employeeStats.reduce((sum, emp) => sum + emp.wonDeals, 0);
    const avgWinRate = employeeStats.length > 0 
      ? employeeStats.reduce((sum, emp) => sum + emp.winRate, 0) / employeeStats.length 
      : 0;
    const topPerformer = employeeStats[0];

    setTeamMetrics({
      totalRevenue,
      totalDeals,
      avgWinRate,
      topPerformer,
      activeTeamMembers: employeeStats.length
    });
  };

  const preparePerformanceChart = () => {
    const chartData = employeeStats.slice(0, 10).map(emp => ({
      name: emp.user.full_name || emp.user.email?.split('@')[0] || 'Unknown',
      revenue: emp.totalRevenue,
      deals: emp.wonDeals,
      winRate: emp.winRate,
      leads: emp.leadsCount
    }));

    setPerformanceData(chartData);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value);
  };

  const getPerformanceLevel = (winRate) => {
    if (winRate >= 80) return { label: 'Excellent', color: 'bg-green-500', textColor: 'text-green-700' };
    if (winRate >= 60) return { label: 'Very Good', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (winRate >= 40) return { label: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    if (winRate >= 20) return { label: 'Average', color: 'bg-orange-500', textColor: 'text-orange-700' };
    return { label: 'Needs Improvement', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const MetricCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card className="clay-card border-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 clay-button flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-end gap-2">
        {[
          { label: '7 Days', value: '7' },
          { label: '30 Days', value: '30' },
          { label: '90 Days', value: '90' },
          { label: 'All Time', value: 'all' }
        ].map(period => (
          <Button
            key={period.value}
            variant={selectedPeriod === period.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period.value)}
            className="clay-button"
          >
            {period.label}
          </Button>
        ))}
      </div>

      {/* Team Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Team Revenue"
          value={formatCurrency(teamMetrics.totalRevenue || 0)}
          icon={Trophy}
          color="text-yellow-600"
          subtitle="entire team"
        />
        <MetricCard
          title="Total Deals Won"
          value={teamMetrics.totalDeals || 0}
          icon={Award}
          color="text-green-600"
          subtitle="closed deals"
        />
        <MetricCard
          title="Average Win Rate"
          value={`${teamMetrics.avgWinRate?.toFixed(1) || 0}%`}
          icon={Target}
          color="text-blue-600"
          subtitle="team average"
        />
        <MetricCard
          title="Team Members"
          value={teamMetrics.activeTeamMembers || 0}
          icon={Users}
          color="text-purple-600"
          subtitle="active members"
        />
      </div>

      {/* Top Performer Highlight */}
      {teamMetrics.topPerformer && (
        <Card className="clay-card border-none clay-primary-gradient text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Star className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Top Performer This Month</h3>
                <p className="text-lg">{teamMetrics.topPerformer.user.full_name || teamMetrics.topPerformer.user.email}</p>
                <p className="text-sm opacity-90">
                  {formatCurrency(teamMetrics.topPerformer.totalRevenue)} • 
                  {teamMetrics.topPerformer.wonDeals} deals • 
                  {teamMetrics.topPerformer.winRate.toFixed(1)}% win rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Employee */}
        <Card className="clay-card border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Revenue by Employee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatCurrency} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#fbbf24" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win Rate Distribution */}
        <Card className="clay-card border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Win Rate Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Bar dataKey="winRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Employee Performance Table */}
      <Card className="clay-card border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Team Performance Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2">Employee</th>
                  <th className="text-right py-3 px-2">Leads</th>
                  <th className="text-right py-3 px-2">Opportunities</th>
                  <th className="text-right py-3 px-2">Deals Won</th>
                  <th className="text-right py-3 px-2">Revenue</th>
                  <th className="text-center py-3 px-2">Win Rate</th>
                  <th className="text-center py-3 px-2">Avg Deal Size</th>
                  <th className="text-center py-3 px-2">Sales Cycle</th>
                </tr>
              </thead>
              <tbody>
                {employeeStats.map((emp, index) => {
                  const performance = getPerformanceLevel(emp.winRate);
                  return (
                    <tr key={emp.user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="clay-primary-gradient text-white text-xs">
                              {emp.user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">
                              {emp.user.full_name || emp.user.email}
                            </div>
                            <div className="text-xs text-gray-500">
                              {emp.user.job_title || 'Sales'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 font-medium">{emp.leadsCount}</td>
                      <td className="text-right py-3 px-2">{emp.opportunitiesCount}</td>
                      <td className="text-right py-3 px-2 font-medium text-green-600">{emp.wonDeals}</td>
                      <td className="text-right py-3 px-2 font-bold">{formatCurrency(emp.totalRevenue)}</td>
                      <td className="text-center py-3 px-2">
                        <Badge className={`${performance.color} text-white`}>
                          {emp.winRate.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-2">{formatCurrency(emp.avgDealSize)}</td>
                      <td className="text-center py-3 px-2">
                        <span className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {Math.round(emp.avgSalesCycle)} days
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
