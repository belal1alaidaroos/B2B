import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle, BarChart, Clock } from 'lucide-react';

const icons = {
  totalQuotes: FileText,
  pendingQuotes: Clock,
  totalValue: BarChart,
  acceptanceRate: CheckCircle,
};

const iconColors = {
  totalQuotes: 'text-blue-600 bg-blue-100',
  pendingQuotes: 'text-orange-600 bg-orange-100',
  totalValue: 'text-emerald-600 bg-emerald-100',
  acceptanceRate: 'text-green-600 bg-green-100'
};

export default function QuoteStats({ stats, isLoading }) {
  const statsData = [
    { key: 'totalQuotes', label: 'Total Quotes', value: stats.totalQuotes.toLocaleString() },
    { key: 'pendingQuotes', label: 'Pending Quotes', value: stats.pendingQuotes.toLocaleString() },
    { key: 'totalValue', label: 'Total Value', value: `$${(stats.totalValue / 1000).toFixed(0)}K` },
    { key: 'acceptanceRate', label: 'Acceptance Rate', value: `${stats.acceptanceRate.toFixed(1)}%` }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="clay-card p-3 rounded-xl flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {statsData.map(stat => {
        const Icon = icons[stat.key];
        return (
          <Card key={stat.key} className="clay-card p-3 rounded-xl flex items-center gap-4 border-none hover:shadow-md transition-shadow duration-200">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColors[stat.key]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              <p className="text-xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}