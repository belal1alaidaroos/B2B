
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChartHorizontal } from 'lucide-react'; // Added import for the icon

const statusColors = {
  new: { bg: 'bg-gray-100', text: 'text-gray-700', accent: '#E5E7EB' },
  contacted: { bg: 'bg-blue-100', text: 'text-blue-700', accent: 'var(--clay-blue)' },
  qualified: { bg: 'bg-emerald-100', text: 'text-emerald-700', accent: 'var(--clay-emerald)' },
  proposal_sent: { bg: 'bg-yellow-100', text: 'text-yellow-700', accent: '#FEF3C7' },
  negotiation: { bg: 'bg-green-100', text: 'text-green-700', accent: 'var(--clay-sage)' },
  won: { bg: 'bg-green-100', text: 'text-green-700', accent: 'var(--clay-mint)' },
  lost: { bg: 'bg-red-100', text: 'text-red-700', accent: '#FECACA' }
};

const statusLabels = {
  new: 'New Leads',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost'
};

export default function PipelineOverview({ leads, isLoading }) {
  if (isLoading) {
    return (
      <Card className="clay-card border-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Sales Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const pipelineData = Object.keys(statusLabels).map(status => {
    const statusLeads = leads.filter(lead => lead.status === status);
    const count = statusLeads.length;
    const value = statusLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
    const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
    
    return {
      status,
      label: statusLabels[status],
      count,
      value,
      percentage,
      color: statusColors[status]
    };
  }).filter(item => item.count > 0);

  return (
    <Card className="clay-card border-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800">Sales Pipeline</CardTitle>
        <p className="text-sm text-gray-600">Track your leads through the sales process</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {pipelineData.map((item) => (
          <div key={item.status} className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color.accent }}
                />
                <span className="font-medium text-gray-800">{item.label}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-800">{item.count}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ${(item.value / 1000).toFixed(0)}K
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: item.color.accent
                  }}
                />
              </div>
              <span className="absolute right-0 -top-5 text-xs text-gray-500">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
        
        {pipelineData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 clay-element flex items-center justify-center">
              <BarChartHorizontal className="w-8 h-8 text-gray-400" /> {/* Replaced emoji with icon */}
            </div>
            <p>No pipeline data available</p>
            <p className="text-sm">Add some leads to see your sales pipeline</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
