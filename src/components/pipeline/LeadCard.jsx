
import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, User, Phone, Mail, GitCommitVertical, Hash } from 'lucide-react';

export default function LeadCard({ lead, index, onEdit, onConvertToOpportunity, currency = 'AED' }) {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency, // Now uses the currency prop
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
        >
          <Card 
            className={`w-full rounded-2xl shadow-sm transition-shadow hover:shadow-lg ${snapshot.isDragging ? 'bg-blue-50' : 'bg-white'}`}
          >
            <CardHeader className="p-3 pb-2" onClick={() => onEdit(lead)}>
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-semibold text-gray-800">{lead.company_name}</CardTitle>
                <Badge className={`${priorityColors[lead.priority] || priorityColors.medium} px-2 py-0.5 text-xs`}>{lead.priority}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 gap-1.5 mt-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3"/>
                  <span>{lead.contact_person}</span>
                </div>
                {lead.lead_number && (
                  <div className="flex items-center gap-1 font-mono text-emerald-700">
                     <Hash className="w-3 h-3" />
                     {lead.lead_number}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0" onClick={() => onEdit(lead)}>
              <div className="flex justify-between items-center text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>{lead.estimated_value ? currencyFormatter.format(lead.estimated_value) : 'N/A'}</span>
                </div>
                <Badge variant="outline">{lead.source}</Badge>
              </div>
            </CardContent>
            {lead.status !== 'won' && lead.status !== 'lost' && (
              <div className="p-2 border-t">
                <Button 
                  variant="ghost" 
                  className="w-full h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConvertToOpportunity(lead);
                  }}
                >
                  <GitCommitVertical className="w-3.5 h-3.5 mr-2"/>
                  Convert to Opportunity
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </Draggable>
  );
}
