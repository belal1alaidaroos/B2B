import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Clock, Play, AlertTriangle, BarChart3 } from 'lucide-react';

export default function TaskStats({ stats, isLoading }) {
  const statItems = [
    {
      title: 'Total Tasks',
      value: stats.total,
      icon: BarChart3,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: Play,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-100'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {statItems.map((item) => (
        <Card key={item.title} className="clay-card border-none hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">{item.title}</p>
              <p className="text-2xl font-bold text-gray-800">{item.value || 0}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}