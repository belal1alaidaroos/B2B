import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Edit, Trash2, Download, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import ProtectedComponent from '@/components/common/ProtectedComponent';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  viewed: 'bg-green-100 text-green-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800',
};

export default function QuoteList({ quotes, leads, isLeadsLoading, viewMode, onEdit, onDelete }) {
  const getLeadInfo = (leadId) => {
    if (!leadId || isLeadsLoading || !leads) return null;
    return leads.find(lead => lead.id === leadId);
  };

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Quotes Found</h3>
        <p className="text-gray-500">Create your first quote to get started.</p>
      </div>
    );
  }

  // Simple action buttons that don't wait for permission checks to render
  const ActionButtons = ({ quote }) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={() => onEdit(quote)} className="h-8 w-8 hover:bg-white/50" title="View Quote">
        <Eye className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/50" title="Download PDF">
        <Download className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onEdit(quote)} className="h-8 w-8 hover:bg-white/50" title="Edit Quote">
        <Edit className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(quote.id)} className="h-8 w-8 hover:bg-white/50 text-red-500" title="Delete Quote">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  if (viewMode === 'table') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
            <tr>
              <th scope="col" className="px-3 py-2">Quote #</th>
              <th scope="col" className="px-3 py-2">Client</th>
              <th scope="col" className="px-3 py-2">Date</th>
              <th scope="col" className="px-3 py-2">Amount</th>
              <th scope="col" className="px-3 py-2">Status</th>
              <th scope="col" className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => {
              const lead = getLeadInfo(quote.lead_id);
              return (
                <tr key={quote.id} className="border-b border-gray-200/50 hover:bg-gray-50/30">
                  <td className="px-3 py-1.5">
                    <span className="font-semibold text-gray-900">{quote.quote_number}</span>
                  </td>
                  <td className="px-3 py-1.5">
                    <div>
                      <p className="font-medium text-gray-900">{quote.client_company || 'Unknown Client'}</p>
                      <p className="text-xs text-gray-500">{quote.client_contact || lead?.contact_person || '-'}</p>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-gray-600 text-xs">
                    {quote.created_date ? format(new Date(quote.created_date), 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="font-semibold text-gray-900">
                      ${(parseFloat(quote.total_amount) || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <Badge className={`${statusColors[quote.status] || statusColors.draft} border-none capitalize text-xs`}>
                      {quote.status || 'draft'}
                    </Badge>
                  </td>
                  <td className="px-3 py-1.5">
                    <ActionButtons quote={quote} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Grid View
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-2">
      {quotes.map(quote => {
        const lead = getLeadInfo(quote.lead_id);
        return (
          <Card key={quote.id} className="clay-card border-none hover:shadow-md transition-shadow duration-200 group">
            <CardContent className="p-3 flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 clay-button flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-gray-800 truncate">{quote.quote_number}</h3>
                    <Badge className={`${statusColors[quote.status] || statusColors.draft} border-none capitalize text-xs`}>
                      {quote.status || 'draft'}
                    </Badge>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(quote)} className="h-7 w-7 hover:bg-white/50" title="View Quote">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/50" title="Download PDF">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(quote)} className="h-7 w-7 hover:bg-white/50" title="Edit Quote">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(quote.id)} className="h-7 w-7 hover:bg-white/50 text-red-500" title="Delete Quote">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 my-3 flex-grow">
                <p className="font-medium text-sm text-gray-900 truncate">{quote.client_company || 'Unknown Client'}</p>
                <p className="text-gray-500 truncate">{quote.client_contact || lead?.contact_person || '-'}</p>
                {quote.created_date && (
                  <div className="flex items-center gap-2 pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="truncate">Issued: {format(new Date(quote.created_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                <div className="text-sm font-bold text-gray-800">
                  ${(parseFloat(quote.total_amount) || 0).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}