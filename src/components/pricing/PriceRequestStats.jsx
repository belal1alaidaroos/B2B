import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Hourglass, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, isLoading }) => (
  <Card className="clay-card border-none">
    <CardContent className="p-4">
      {isLoading ? (
        <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-1/3" />
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
          </div>
          <div className={`w-10 h-10 clay-button flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

export default function PriceRequestStats({ requests = [], isLoading }) {
  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    escalated: requests.filter(r => r.status === 'escalated').length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title="Pending Review" 
        value={stats.pending} 
        icon={Hourglass}
        color="text-yellow-600"
        isLoading={isLoading} 
      />
      <StatCard 
        title="Approved" 
        value={stats.approved} 
        icon={CheckCircle}
        color="text-green-600"
        isLoading={isLoading} 
      />
      <StatCard 
        title="Rejected" 
        value={stats.rejected} 
        icon={XCircle}
        color="text-red-600"
        isLoading={isLoading} 
      />
      <StatCard 
        title="Escalated" 
        value={stats.escalated} 
        icon={AlertTriangle}
        color="text-orange-600"
        isLoading={isLoading} 
      />
    </div>
  );
}