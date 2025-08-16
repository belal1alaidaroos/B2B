import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, Flag, DollarSign, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    quoted: 'bg-blue-100 text-blue-800 border-blue-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    escalated: 'bg-orange-100 text-orange-800 border-orange-200',
};

const priorityStyles = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-yellow-100 text-yellow-800',
    urgent: 'bg-red-100 text-red-800',
};

export default function PriceRequestCard({ request, lead, requester, onView }) {

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow duration-200 clay-card">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
        <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-3">
                <Badge className={statusStyles[request.status] || 'bg-gray-200'}>
                    {getStatusLabel(request.status)}
                </Badge>
                <h3 className="font-bold text-lg text-gray-800">{request.request_details?.job_profile_title || 'N/A'}</h3>
            </div>
          <p className="text-sm text-gray-600">
            For lead: <span className="font-medium text-blue-600">{lead?.company_name || 'N/A'}</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <User className="w-3 h-3"/>
            <span>Requested by: {requester?.full_name || request.requested_by}</span>
          </div>
        </div>
        
        <div className="md:col-span-2 space-y-2 text-sm">
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Due: {format(new Date(request.due_date), 'PPP')}</span>
            </div>
            <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-gray-500" />
                <span>Priority:</span>
                <Badge className={`${priorityStyles[request.priority] || ''} text-xs`}>
                    {request.priority}
                </Badge>
            </div>
        </div>

        <div className="md:col-span-1 flex justify-end">
            <Button onClick={() => onView(request)} className="clay-button">
              Review
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}