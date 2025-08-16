import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileSignature, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { isAfter, addDays, parseISO } from 'date-fns';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED',
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value);
};

export default function ContractStats({ contracts, isLoading }) {
  const stats = useMemo(() => {
    if (!contracts) return { totalValue: 0, activeCount: 0, expiringSoonCount: 0 };
    
    const now = new Date();
    const ninetyDaysFromNow = addDays(now, 90);

    const activeContracts = contracts.filter(c => c.status === 'active');
    
    const totalValue = activeContracts.reduce((sum, c) => sum + (c.total_value || 0), 0);
    const expiringSoonCount = activeContracts.filter(c => {
        const endDate = c.end_date ? parseISO(c.end_date) : null;
        return endDate && isAfter(ninetyDaysFromNow, endDate) && isAfter(endDate, now);
    }).length;

    return {
      totalValue,
      activeCount: activeContracts.length,
      expiringSoonCount
    };
  }, [contracts]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard 
        title="Total Contract Value (Active)" 
        value={formatCurrency(stats.totalValue)} 
        icon={DollarSign} 
        color="green" 
      />
      <StatCard 
        title="Active Contracts" 
        value={stats.activeCount} 
        icon={CheckCircle} 
        color="blue" 
      />
      <StatCard 
        title="Expiring in 90 Days" 
        value={stats.expiringSoonCount} 
        icon={AlertTriangle} 
        color="orange" 
      />
    </div>
  );
}

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
  };
  return (
    <Card className="clay-card border-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </CardContent>
    </Card>
  );
};