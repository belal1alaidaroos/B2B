import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, CheckCircle, Clock, Users } from 'lucide-react';

const icons = {
  totalJobs: Briefcase,
  activeJobs: CheckCircle,
  pendingJobs: Clock,
  totalPersonnel: Users,
};

const iconColors = {
  totalJobs: 'text-blue-600 bg-blue-100',
  activeJobs: 'text-green-600 bg-green-100',
  pendingJobs: 'text-orange-600 bg-orange-100',
  totalPersonnel: 'text-purple-600 bg-purple-100',
};

export default function JobStats({ stats, isLoading }) {
  const statsData = [
    { key: 'totalJobs', label: 'Total Jobs', value: stats.totalJobs.toLocaleString() },
    { key: 'activeJobs', label: 'Active Jobs', value: stats.activeJobs.toLocaleString() },
    { key: 'pendingJobs', label: 'Pending Jobs', value: stats.pendingJobs.toLocaleString() },
    { key: 'totalPersonnel', label: 'Total Personnel', value: stats.totalPersonnel.toLocaleString() },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="clay-card p-3 rounded-xl flex items-center gap-3 border-none">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-12" />
            </div>
          </Card>
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