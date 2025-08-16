import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  Eye, 
  Edit,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { format } from 'date-fns';

const getTypeIcon = (type) => {
  const icons = {
    email: Mail,
    phone: Phone,
    meeting: Calendar,
    whatsapp: MessageSquare,
    sms: MessageSquare
  };
  return icons[type] || MessageSquare;
};

const getStatusColor = (status) => {
  const colors = {
    sent: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    read: 'bg-emerald-100 text-emerald-800',
    replied: 'bg-teal-100 text-teal-800',
    failed: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export default function CommunicationList({ communications, leads }) {
  const getLeadInfo = (leadId) => {
    return leads.find(lead => lead.id === leadId);
  };

  if (communications.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Communications Found</h3>
        <p className="text-gray-500">Start logging your client interactions to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      {communications.map((comm) => {
        const lead = getLeadInfo(comm.lead_id);
        const TypeIcon = getTypeIcon(comm.type);
        
        return (
          <div 
            key={comm.id} 
            className="flex items-start gap-4 p-5 clay-element hover:shadow-lg transition-all duration-200 group"
          >
            {/* Icon & Direction */}
            <div className="flex-shrink-0 relative">
              <div className="w-12 h-12 clay-button flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <TypeIcon className="w-6 h-6 text-emerald-700" />
              </div>
              <div className="absolute -bottom-1 -right-1">
                {comm.direction === 'outbound' ? (
                  <ArrowUpRight className="w-4 h-4 text-blue-600 bg-white rounded-full p-0.5" />
                ) : (
                  <ArrowDownLeft className="w-4 h-4 text-green-600 bg-white rounded-full p-0.5" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h4 className="font-semibold text-gray-800 truncate">
                    {comm.subject || `${comm.type.charAt(0).toUpperCase() + comm.type.slice(1)} with ${lead?.company_name || 'Unknown'}`}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <span>{lead?.company_name || 'Unknown Company'}</span>
                    <span>•</span>
                    <span>{format(new Date(comm.created_date), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(comm.status)} border-none rounded-xl text-xs`}>
                    {comm.status}
                  </Badge>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                {comm.content}
              </p>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 px-3 hover:bg-white/50 rounded-xl">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3 hover:bg-white/50 rounded-xl">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}