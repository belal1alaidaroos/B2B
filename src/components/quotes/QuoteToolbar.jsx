
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search, RotateCcw, Grid3x3, List } from 'lucide-react';

export default function QuoteToolbar({ filters, onFiltersChange, viewMode, onViewModeChange }) {
  const updateFilter = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    onFiltersChange({
      status: 'all',
      dateRange: 'all',
      client: 'all'
    });
  };

  return (
    <div className="p-2 mb-2 flex flex-wrap items-center gap-2 border-b border-gray-200/50">
      <div className="relative flex-grow min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search quotes..." className="clay-element border-none pl-9 h-9" />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="clay-element border-none w-36 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
          <SelectTrigger className="clay-element border-none w-36 h-9">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
       <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="clay-element hover:bg-white/50 h-9"
        >
          <RotateCcw className="w-3 h-3 mr-2" />
          Reset
        </Button>

      <div className="flex items-center gap-1 clay-element p-0.5 rounded-lg ml-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewModeChange('grid')}
          className={`h-8 w-8 rounded-md ${viewMode === 'grid' ? 'bg-white/50' : ''}`}
        >
          <Grid3x3 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewModeChange('table')}
          className={`h-8 w-8 rounded-md ${viewMode === 'table' ? 'bg-white/50' : ''}`}
        >
          <List className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
