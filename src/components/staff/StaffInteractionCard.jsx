import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const getPriorityColor = (priority) => {
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-blue-100 text-blue-800', 
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };
  return colors[priority] || colors.medium;
};

const getStatusColor = (status) => {
  const colors = {
    open: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    waiting_customer: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    escalated: 'bg-red-100 text-red-800'
  };
  return colors[status] || colors.open;
};

export default function StaffInteractionCard({ interaction, customerInfo, currentUser, onView, onAssign }) {
  const isAssignedToMe = interaction.assigned_to_employee_user_id === currentUser?.id;
  const isUnassigned = !interaction.assigned_to_employee_user_id;
  
  const latestMessage = interaction.messages && interaction.messages.length > 0 
    ? interaction.messages[interaction.messages.length - 1] 
    : null;

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {interaction.subject}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <User className="w-4 h-4" />
              <span>{customerInfo.name}</span>
              <span className="text-gray-400">•</span>
              <span className="capitalize">{customerInfo.type}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Created {format(new Date(interaction.created_date), 'MMM d, yyyy h:mm a')}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-2">
              <Badge className={`${getPriorityColor(interaction.priority)} border-none`}>
                {interaction.priority}
              </Badge>
              <Badge className={`${getStatusColor(interaction.status)} border-none`}>
                {interaction.status.replace('_', ' ')}
              </Badge>
            </div>
            {interaction.interaction_type && (
              <Badge variant="outline" className="text-xs">
                {interaction.interaction_type.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>

        {latestMessage && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 line-clamp-2">
              {latestMessage.content}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {latestMessage.sender_type === 'customer' ? 'Customer' : 'Staff'} • 
              {format(new Date(latestMessage.timestamp), 'MMM d, h:mm a')}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm">
            {isUnassigned ? (
              <span className="text-orange-600 font-medium">Unassigned</span>
            ) : isAssignedToMe ? (
              <span className="text-blue-600 font-medium">Assigned to me</span>
            ) : (
              <span className="text-gray-600">
                Assigned to {interaction.assigned_to_employee_name}
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            {isUnassigned && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAssign(interaction)}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <User className="w-4 h-4 mr-1" />
                Assign to Me
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => onView(interaction)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              View Details
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}