import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Users,
  Eye,
  Edit
} from 'lucide-react';

export default function AuditLogStats({ auditLogs, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="clay-card border-none">
            <CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalActivities = auditLogs.length;
  const successfulActions = auditLogs.filter(log => log.success).length;
  const failedActions = auditLogs.filter(log => !log.success).length;
  const highRiskActions = auditLogs.filter(log => 
    log.risk_level === 'high' || log.risk_level === 'critical'
  ).length;
  const complianceRelevant = auditLogs.filter(log => log.compliance_relevant).length;
  const uniqueUsers = new Set(auditLogs.map(log => log.user_id)).size;
  const dataModifications = auditLogs.filter(log => 
    ['create', 'update', 'delete'].includes(log.action)
  ).length;
  const viewActions = auditLogs.filter(log => log.action === 'view').length;

  const stats = [
    {
      title: 'Total Activities',
      value: totalActivities.toString(),
      icon: Activity,
      color: 'blue'
    },
    {
      title: 'Successful Actions',
      value: successfulActions.toString(),
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      title: 'Failed Actions',
      value: failedActions.toString(),
      icon: XCircle,
      color: 'red'
    },
    {
      title: 'High Risk Actions',
      value: highRiskActions.toString(),
      icon: AlertTriangle,
      color: 'orange'
    },
    {
      title: 'Compliance Events',
      value: complianceRelevant.toString(),
      icon: Shield,
      color: 'purple'
    },
    {
      title: 'Active Users',
      value: uniqueUsers.toString(),
      icon: Users,
      color: 'cyan'
    },
    {
      title: 'Data Changes',
      value: dataModifications.toString(),
      icon: Edit,
      color: 'amber'
    },
    {
      title: 'View Actions',
      value: viewActions.toString(),
      icon: Eye,
      color: 'green'
    }
  ];

  const colorMap = {
    blue: 'text-blue-600 bg-blue-100',
    emerald: 'text-emerald-600 bg-emerald-100',
    red: 'text-red-600 bg-red-100',
    orange: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-600 bg-purple-100',
    cyan: 'text-cyan-600 bg-cyan-100',
    amber: 'text-amber-600 bg-amber-100',
    green: 'text-green-600 bg-green-100'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.slice(0, 4).map((stat, index) => (
        <Card key={index} className="clay-card border-none hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[stat.color]}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}