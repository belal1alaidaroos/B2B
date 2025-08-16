
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, 
  FileText, 
  Phone, 
  Mail, 
  Calendar,
  Eye,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

const getActivityIcon = (type) => {
  const icons = {
    email: Mail,
    phone: Phone,
    meeting: Calendar,
    whatsapp: MessageSquare,
    quote: FileText
  };
  return icons[type] || MessageSquare;
};

const getStatusColor = (status) => {
  const colors = {
    sent: 'bg-cyan-100 text-cyan-800',
    viewed: 'bg-green-100 text-green-800', 
    replied: 'bg-teal-100 text-teal-800',
    accepted: 'bg-emerald-100 text-emerald-800', 
    rejected: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export default function RecentActivity({ communications, quotes, isLoading }) {
  if (isLoading) {
    return (
      <Card className="clay-card border-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="w-10 h-10 rounded-2xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Combine and sort activities
  const activities = [
    ...communications.map(comm => ({
      ...comm,
      activityType: 'communication',
      timestamp: new Date(comm.created_date)
    })),
    ...quotes.map(quote => ({
      ...quote,
      activityType: 'quote',
      timestamp: new Date(quote.updated_date || quote.created_date)
    }))
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);

  return (
    <Card className="clay-card border-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon = activity.activityType === 'quote' ? FileText : getActivityIcon(activity.type);
            
            return (
              <div 
                key={`${activity.activityType}-${activity.id}-${index}`}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/50 transition-all duration-200 group"
              >
                <div className="w-10 h-10 clay-button flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Icon className="w-5 h-5 text-emerald-700" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {activity.activityType === 'quote' 
                      ? `Quote ${activity.quote_number} for ${activity.client_company}`
                      : activity.subject || activity.content?.substring(0, 50) + '...'
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(activity.timestamp, 'MMM d, h:mm a')}
                  </p>
                </div>
                
                <Badge className={`${getStatusColor(activity.status)} border-none rounded-xl`}>
                  {activity.status}
                </Badge>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  );
}
