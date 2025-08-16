
import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, Building, MoreVertical } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function OpportunityCard({ opportunity, index, onEdit, currency = 'AED' }) {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <Draggable draggableId={opportunity.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-4 group"
        >
          <Card 
            className={`w-full rounded-xl shadow-md shadow-gray-200/50 border border-gray-200/80 bg-white transition-all duration-200 group-hover:shadow-xl group-hover:-translate-y-1 ${snapshot.isDragging ? 'shadow-2xl -translate-y-1 rotate-3' : ''}`}
            onClick={() => onEdit(opportunity)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-base text-gray-800 leading-tight pr-2">{opportunity.name}</h4>
                  {opportunity.opportunity_number ? (
                    <Badge variant="outline" className="text-xs font-mono">{opportunity.opportunity_number}</Badge>
                  ) : (
                    <button className="text-gray-400 hover:text-gray-600 flex-shrink-0" onClick={(e) => {e.stopPropagation(); onEdit(opportunity)}}>
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  )}
              </div>
              
              {opportunity.account?.company_name && (
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span>{opportunity.account.company_name}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                 <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <DollarSign className="w-4 h-4" />
                    <span>{currencyFormatter.format(opportunity.amount)}</span>
                 </div>
                 {opportunity.expected_close_date && (
                    <div className="flex items-center text-xs text-gray-500 gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{format(parseISO(opportunity.expected_close_date), 'dd MMM yyyy')}</span>
                    </div>
                  )}
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-500">Probability</span>
                    <span className="text-sm font-bold text-blue-600">{opportunity.probability}%</span>
                </div>
                <Progress value={opportunity.probability} className="h-1.5" />
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
