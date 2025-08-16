import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Crown, CheckCircle, Calendar } from "lucide-react";

const colorMap = {
  blue: 'var(--clay-blue)',
  mint: 'var(--clay-mint)',
  emerald: 'var(--clay-emerald)',
  sage: 'var(--clay-sage)'
};

function StatCard({ title, value, icon: Icon, color, trend, isLoading }) {
  if (isLoading) {
    return (
      <Card className="clay-card border-none overflow-hidden">
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-2">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <Skeleton className="h-6 w-14 mb-1 rounded-xl" />
          <Skeleton className="h-2 w-24 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="clay-card border-none overflow-hidden group hover:scale-105 transition-all duration-300">
      <div 
        className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20 transform translate-x-6 -translate-y-6"
        style={{ backgroundColor: colorMap[color] }}
      />
      <CardContent className="p-3 relative">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-medium text-gray-600">{title}</p>
          <div 
            className="p-1.5 rounded-xl"
            style={{ backgroundColor: colorMap[color] }}
          >
            <Icon className="w-3.5 h-3.5 text-gray-700" />
          </div>
        </div>
        
        <div className="mb-1">
          <h3 className="text-2xl font-bold text-gray-800 group-hover:scale-110 transition-transform duration-300">
            {value}
          </h3>
        </div>
        
        {trend && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ContactStats({ stats, isLoading }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <StatCard
        title="Total Contacts"
        value={stats.totalContacts.toString()}
        icon={User}
        color="blue"
        trend="across all accounts"
        isLoading={isLoading}
      />
      <StatCard
        title="Decision Makers"
        value={stats.decisionMakers.toString()}
        icon={Crown}
        color="emerald"
        trend={`${((stats.decisionMakers / stats.totalContacts) * 100).toFixed(1)}% of total`}
        isLoading={isLoading}
      />
      <StatCard
        title="Active Contacts"
        value={stats.activeContacts.toString()}
        icon={CheckCircle}
        color="mint"
        trend="ready for outreach"
        isLoading={isLoading}
      />
      <StatCard
        title="Recent Activity"
        value={stats.recentContacts.toString()}
        icon={Calendar}
        color="sage"
        trend="contacted in 30 days"
        isLoading={isLoading}
      />
    </div>
  );
}