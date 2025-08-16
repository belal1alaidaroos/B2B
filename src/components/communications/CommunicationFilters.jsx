import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, RotateCcw } from 'lucide-react';

export default function CommunicationFilters({ filters, onFiltersChange }) {
  const updateFilter = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    onFiltersChange({
      type: 'all',
      direction: 'all',
      status: 'all',
      dateRange: 'all'
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-gray-200/50">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filters:</span>
      </div>

      <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
        <SelectTrigger className="w-32 clay-element border-none h-10">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent className="clay-card border-none">
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="phone">Phone</SelectItem>
          <SelectItem value="meeting">Meeting</SelectItem>
          <SelectItem value="whatsapp">WhatsApp</SelectItem>
          <SelectItem value="sms">SMS</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.direction} onValueChange={(value) => updateFilter('direction', value)}>
        <SelectTrigger className="w-32 clay-element border-none h-10">
          <SelectValue placeholder="Direction" />
        </SelectTrigger>
        <SelectContent className="clay-card border-none">
          <SelectItem value="all">All Directions</SelectItem>
          <SelectItem value="inbound">Inbound</SelectItem>
          <SelectItem value="outbound">Outbound</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
        <SelectTrigger className="w-32 clay-element border-none h-10">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="clay-card border-none">
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
          <SelectItem value="read">Read</SelectItem>
          <SelectItem value="replied">Replied</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="sm"
        onClick={resetFilters}
        className="clay-element hover:bg-white/50 h-10"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset
      </Button>
    </div>
  );
}