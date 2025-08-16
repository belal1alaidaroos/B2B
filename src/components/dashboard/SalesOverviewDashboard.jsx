
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  FunnelChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Clock,
  Award,
  AlertTriangle
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const FUNNEL_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function SalesOverviewDashboard({ leads, opportunities, quotes, currency }) {
  const [timeRange, setTimeRange] = useState('30'); // days
  const [salesMetrics, setSalesMetrics] = useState({});
  const [funnelData, setFunnelData] = useState([]);
  const [conversionData, setConversionData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    if (leads && opportunities && quotes) {
      calculateMetrics();
      prepareFunnelData();
      prepareConversionData();
      prepareRevenueData();
    }
  }, [leads, opportunities, quotes, timeRange]);

  const getFilteredData = (data) => {
    if (!timeRange || timeRange === 'all') return data;
    const daysAgo = parseInt(timeRange);
    const cutoffDate = subDays(new Date(), daysAgo);
    return data.filter(item => new Date(item.created_date) >= cutoffDate);
  };

  const calculateMetrics = () => {
    const filteredLeads = getFilteredData(leads);
    const filteredOpps = getFilteredData(opportunities);
    const filteredQuotes = getFilteredData(quotes);

    const totalPipelineValue = filteredOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);
    const wonOpps = filteredOpps.filter(opp => opp.stage === 'closed_won');
    const totalRevenue = wonOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);
    const avgDealSize = wonOpps.length > 0 ? totalRevenue / wonOpps.length : 0;
    const winRate = filteredOpps.length > 0 ? (wonOpps.length / filteredOpps.length * 100) : 0;

    // Calculate average sales cycle
    const completedOpps = filteredOpps.filter(opp => ['closed_won', 'closed_lost'].includes(opp.stage));
    const avgSalesCycle = completedOpps.length > 0
      ? completedOpps.reduce((sum, opp) => {
          const start = new Date(opp.created_date);
          const end = new Date(opp.updated_date);
          return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        }, 0) / completedOpps.length
      : 0;

    setSalesMetrics({
      totalPipelineValue,
      totalRevenue,
      avgDealSize,
      winRate,
      avgSalesCycle,
      activeOpportunities: filteredOpps.filter(opp => !['closed_won', 'closed_lost'].includes(opp.stage)).length,
      newLeads: filteredLeads.length,
      quotesGenerated: filteredQuotes.length
    });
  };

  const prepareFunnelData = () => {
    const stages = [
      { name: 'Leads', key: 'leads', count: leads.length },
      { name: 'Qualified', key: 'qualified', count: leads.filter(l => l.status === 'qualified').length },
      { name: 'Opportunities', key: 'opportunities', count: opportunities.length },
      { name: 'Proposals', key: 'proposals', count: opportunities.filter(o => o.stage === 'proposal').length },
      { name: 'Closed Won', key: 'won', count: opportunities.filter(o => o.stage === 'closed_won').length }
    ];

    // Calculate conversion rates
    const funnelWithConversion = stages.map((stage, index) => ({
      ...stage,
      conversionRate: index === 0 ? 100 : stages[0].count > 0 ? (stage.count / stages[0].count * 100).toFixed(1) : 0
    }));

    setFunnelData(funnelWithConversion);
  };

  const prepareConversionData = () => {
    const leadStatuses = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'];
    const statusData = leadStatuses.map(status => ({
      status: status.replace('_', ' ').toUpperCase(),
      count: leads.filter(l => l.status === status).length,
      value: leads.filter(l => l.status === status).reduce((sum, l) => sum + (l.estimated_value || 0), 0)
    }));

    setConversionData(statusData);
  };

  const prepareRevenueData = () => {
    // Group won opportunities by month
    const wonOpps = opportunities.filter(opp => opp.stage === 'closed_won');
    const revenueByMonth = {};

    wonOpps.forEach(opp => {
      const month = format(new Date(opp.updated_date || opp.created_date), 'MMM yyyy');
      revenueByMonth[month] = (revenueByMonth[month] || 0) + (opp.amount || 0);
    });

    const revenueArray = Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue,
      deals: wonOpps.filter(opp => {
        const oppMonth = format(new Date(opp.updated_date || opp.created_date), 'MMM yyyy');
        return oppMonth === month;
      }).length
    }));

    setRevenueData(revenueArray.slice(-6)); // Last 6 months
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

  const MetricCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
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
        {trend && (
          <div className="flex items-center mt-2 text-xs">
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
            )}
            <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(trend)}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end gap-2">
        {[
          { label: '7 Days', value: '7' },
          { label: '30 Days', value: '30' },
          { label: '90 Days', value: '90' },
          { label: 'All Time', value: 'all' }
        ].map(range => (
          <Button
            key={range.value}
            variant={timeRange === range.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range.value)}
            className="clay-button"
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Pipeline Value"
          value={formatCurrency(salesMetrics.totalPipelineValue || 0)}
          icon={DollarSign}
          color="text-green-600"
          subtitle={`${salesMetrics.activeOpportunities || 0} active opportunities`}
        />
        <MetricCard
          title="Revenue Generated"
          value={formatCurrency(salesMetrics.totalRevenue || 0)}
          icon={Award}
          color="text-blue-600"
          subtitle={`Avg Deal: ${formatCurrency(salesMetrics.avgDealSize || 0)}`}
        />
        <MetricCard
          title="Win Rate"
          value={`${salesMetrics.winRate?.toFixed(1) || 0}%`}
          icon={Target}
          color="text-purple-600"
          subtitle="of total opportunities"
        />
        <MetricCard
          title="Sales Cycle"
          value={`${Math.round(salesMetrics.avgSalesCycle || 0)} days`}
          icon={Clock}
          color="text-orange-600"
          subtitle="average deal closure"
        />
      </div>

      {/* Charts Row 1: Funnel and Pipeline */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sales Funnel */}
        <Card className="clay-card border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Sales Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    name === 'count' ? 'Count' : 'Rate'
                  ]}
                />
                <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-5 gap-2 mt-4">
              {funnelData.map((stage, index) => (
                <div key={stage.key} className="text-center">
                  <div className="text-sm font-medium">{stage.name}</div>
                  <div className="text-xs text-gray-500">{stage.conversionRate}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Distribution */}
        <Card className="clay-card border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Pipeline Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={conversionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {conversionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card className="clay-card border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Revenue Trend - Last 6 Months
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Revenue' : 'Deals'
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                strokeWidth={3}
                dot={{ r: 6 }}
                name="Revenue"
              />
              <Bar dataKey="deals" fill="#82ca9d" name="Deal Count" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
