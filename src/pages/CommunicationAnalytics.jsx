import React, { useState, useEffect } from 'react';
import { CustomerInteraction } from '@/api/entities';
import { Communication } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Users,
  AlertCircle,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function CommunicationAnalytics() {
  const [interactions, setInteractions] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const [interactionsData, communicationsData, usersData] = await Promise.all([
        CustomerInteraction.list('-created_date', 500),
        Communication.list('-created_date', 500),
        User.list()
      ]);
      
      setInteractions(interactionsData || []);
      setCommunications(communicationsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Set empty arrays as fallback
      setInteractions([]);
      setCommunications([]);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate KPIs for Customer Interactions
  const calculateInteractionKPIs = () => {
    const totalInteractions = interactions.length;
    const resolvedInteractions = interactions.filter(i => i.status === 'resolved' || i.status === 'closed').length;
    const avgResponseTime = interactions
      .filter(i => i.first_response_time_minutes)
      .reduce((sum, i) => sum + i.first_response_time_minutes, 0) / 
      interactions.filter(i => i.first_response_time_minutes).length || 0;
    
    const avgResolutionTime = interactions
      .filter(i => i.resolution_time_minutes)
      .reduce((sum, i) => sum + i.resolution_time_minutes, 0) / 
      interactions.filter(i => i.resolution_time_minutes).length || 0;

    return {
      totalInteractions,
      resolvedInteractions,
      resolutionRate: totalInteractions > 0 ? (resolvedInteractions / totalInteractions * 100) : 0,
      avgResponseTime: Math.round(avgResponseTime),
      avgResolutionTime: Math.round(avgResolutionTime / 60), // Convert to hours
      activeInteractions: interactions.filter(i => ['open', 'in_progress'].includes(i.status)).length
    };
  };

  // Calculate KPIs for Communications
  const calculateCommunicationKPIs = () => {
    const totalCommunications = communications.length;
    const todayCommunications = communications.filter(c => {
      const today = new Date().toDateString();
      return new Date(c.created_date).toDateString() === today;
    }).length;

    return {
      totalCommunications,
      todayCommunications,
      emails: communications.filter(c => c.type === 'email').length,
      calls: communications.filter(c => c.type === 'phone').length,
      meetings: communications.filter(c => c.type === 'meeting').length
    };
  };

  // Status distribution for interactions
  const getInteractionStatusDistribution = () => {
    const statusCounts = interactions.reduce((acc, interaction) => {
      acc[interaction.status] = (acc[interaction.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: count
    }));
  };

  // Communication type distribution
  const getCommunicationTypeDistribution = () => {
    const typeCounts = communications.reduce((acc, comm) => {
      acc[comm.type] = (acc[comm.type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type.toUpperCase(),
      value: count
    }));
  };

  // Daily activity over the last 7 days
  const getDailyActivity = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toDateString();
    }).reverse();

    return last7Days.map(dateStr => {
      const interactionCount = interactions.filter(i => 
        new Date(i.created_date).toDateString() === dateStr
      ).length;
      
      const communicationCount = communications.filter(c => 
        new Date(c.created_date).toDateString() === dateStr
      ).length;

      return {
        date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        interactions: interactionCount,
        communications: communicationCount
      };
    });
  };

  // Staff performance data
  const getStaffPerformance = () => {
    const staffStats = {};
    
    interactions.forEach(interaction => {
      if (interaction.assigned_to_employee_user_id) {
        const staffId = interaction.assigned_to_employee_user_id;
        const staffName = interaction.assigned_to_employee_name || 'Unknown Staff';
        
        if (!staffStats[staffId]) {
          staffStats[staffId] = {
            name: staffName,
            total: 0,
            resolved: 0,
            avgResponse: 0,
            responseCount: 0
          };
        }
        
        staffStats[staffId].total++;
        
        if (interaction.status === 'resolved' || interaction.status === 'closed') {
          staffStats[staffId].resolved++;
        }
        
        if (interaction.first_response_time_minutes) {
          staffStats[staffId].avgResponse += interaction.first_response_time_minutes;
          staffStats[staffId].responseCount++;
        }
      }
    });

    return Object.values(staffStats).map(staff => ({
      name: staff.name,
      total: staff.total,
      resolved: staff.resolved,
      resolutionRate: staff.total > 0 ? Math.round((staff.resolved / staff.total) * 100) : 0,
      avgResponse: staff.responseCount > 0 ? Math.round(staff.avgResponse / staff.responseCount) : 0
    }));
  };

  const interactionKPIs = calculateInteractionKPIs();
  const communicationKPIs = calculateCommunicationKPIs();
  const interactionStatusData = getInteractionStatusDistribution();
  const communicationTypeData = getCommunicationTypeDistribution();
  const dailyActivityData = getDailyActivity();
  const staffData = getStaffPerformance();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Communication Analytics</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer Interaction KPI Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Support Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-3xl font-bold text-gray-900">{interactionKPIs.totalInteractions}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-blue-600 bg-blue-100 rounded-lg p-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{interactionKPIs.resolutionRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600 bg-green-100 rounded-lg p-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-3xl font-bold text-gray-900">{interactionKPIs.avgResponseTime}m</p>
                </div>
                <Clock className="w-10 h-10 text-orange-600 bg-orange-100 rounded-lg p-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Tickets</p>
                  <p className="text-3xl font-bold text-gray-900">{interactionKPIs.activeInteractions}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-purple-600 bg-purple-100 rounded-lg p-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Communication KPI Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Communication Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Communications</p>
                  <p className="text-3xl font-bold text-gray-900">{communicationKPIs.totalCommunications}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-indigo-600 bg-indigo-100 rounded-lg p-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today</p>
                  <p className="text-3xl font-bold text-gray-900">{communicationKPIs.todayCommunications}</p>
                </div>
                <Calendar className="w-10 h-10 text-green-600 bg-green-100 rounded-lg p-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Emails</p>
                  <p className="text-3xl font-bold text-gray-900">{communicationKPIs.emails}</p>
                </div>
                <Mail className="w-10 h-10 text-blue-600 bg-blue-100 rounded-lg p-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone Calls</p>
                  <p className="text-3xl font-bold text-gray-900">{communicationKPIs.calls}</p>
                </div>
                <Phone className="w-10 h-10 text-red-600 bg-red-100 rounded-lg p-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <Card className="bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>Daily Activity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="interactions" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Customer Tickets"
                />
                <Line 
                  type="monotone" 
                  dataKey="communications" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Communications"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Interaction Status Distribution */}
        <Card className="bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>Ticket Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={interactionStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {interactionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Communication Type Distribution */}
      <Card className="bg-white border-none shadow-sm">
        <CardHeader>
          <CardTitle>Communication Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={communicationTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Staff Performance */}
      {staffData.length > 0 && (
        <Card className="bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>Staff Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-gray-600">Staff Member</th>
                    <th className="text-left p-4 font-medium text-gray-600">Total Cases</th>
                    <th className="text-left p-4 font-medium text-gray-600">Resolved</th>
                    <th className="text-left p-4 font-medium text-gray-600">Resolution Rate</th>
                    <th className="text-left p-4 font-medium text-gray-600">Avg Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {staffData.map((staff, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          {staff.name}
                        </div>
                      </td>
                      <td className="p-4 font-medium">{staff.total}</td>
                      <td className="p-4 font-medium">{staff.resolved}</td>
                      <td className="p-4">
                        <Badge 
                          className={`${
                            staff.resolutionRate >= 80 
                              ? 'bg-green-100 text-green-800' 
                              : staff.resolutionRate >= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          } border-none`}
                        >
                          {staff.resolutionRate}%
                        </Badge>
                      </td>
                      <td className="p-4 font-medium">{staff.avgResponse}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}