import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function InteractionStats({ stats }) {
  const statCards = [
    {
      title: 'Assigned to Me',
      value: stats.assigned || 0,
      icon: MessageSquare,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Unassigned',
      value: stats.unassigned || 0,
      icon: Clock,
      color: 'text-orange-600 bg-orange-100'
    },
    {
      title: 'High Priority',
      value: stats.highPriority || 0,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-100'
    },
    {
      title: 'Escalated',
      value: stats.escalated || 0,
      icon: CheckCircle,
      color: 'text-purple-600 bg-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="bg-white border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}