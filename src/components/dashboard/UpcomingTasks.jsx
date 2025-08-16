import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";

const getPriorityColor = (priority) => {
  const colors = {
    urgent: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };
  return colors[priority] || colors.medium;
};

const getDateLabel = (date) => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isPast(date)) return 'Overdue';
  return format(date, 'MMM d');
};

export default function UpcomingTasks({ leads, isLoading }) {
  if (isLoading) {
    return (
      <Card className="clay-card border-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Upcoming Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-8 h-8 rounded-2xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const upcomingTasks = leads
    .filter(lead => lead.next_follow_up && lead.status !== 'won' && lead.status !== 'lost')
    .map(lead => ({
      ...lead,
      followUpDate: new Date(lead.next_follow_up)
    }))
    .sort((a, b) => a.followUpDate - b.followUpDate)
    .slice(0, 6);

  return (
    <Card className="clay-card border-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          Upcoming Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No upcoming tasks</p>
            <p className="text-sm">All caught up!</p>
          </div>
        ) : (
          upcomingTasks.map((lead) => {
            const isOverdue = isPast(lead.followUpDate) && !isToday(lead.followUpDate);
            
            return (
              <div 
                key={lead.id}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 hover:scale-102 ${
                  isOverdue ? 'bg-red-50 border-red-200' : 'bg-white/50 border-white/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isOverdue ? 'bg-red-100' : 'clay-button'
                }`}>
                  {isOverdue ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Calendar className="w-5 h-5 text-emerald-700" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    Follow up with {lead.company_name}
                  </p>
                  <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                    {getDateLabel(lead.followUpDate)}
                  </p>
                </div>
                
                <Badge className={`${getPriorityColor(lead.priority)} border rounded-xl text-xs`}>
                  {lead.priority}
                </Badge>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  );
}