
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const colorMap = {
  blue: 'text-blue-600 bg-blue-100',
  mint: 'text-teal-600 bg-teal-100',
  emerald: 'text-emerald-600 bg-emerald-100',
  sage: 'text-green-600 bg-green-100',
};

export default function StatsCard({ title, value, icon: Icon, color, isLoading }) {
  if (isLoading) {
    return (
      <div className="clay-card p-3 rounded-xl flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    );
  }

  return (
    <Card className="clay-card p-3 rounded-xl flex items-center gap-4 border-none hover:shadow-md transition-shadow duration-200">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{title}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </Card>
  );
}
