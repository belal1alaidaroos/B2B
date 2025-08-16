
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, Grid3x3, List } from 'lucide-react';

export default function AccountToolbar({ viewMode, onViewModeChange, onFiltersChange }) {
  
  const handleInputChange = (value) => {
    onFiltersChange(prev => ({ ...prev, searchTerm: value }));
  };

  const handleStatusChange = (value) => {
    onFiltersChange(prev => ({ ...prev, status: value }));
  };

  const handleIndustryChange = (value) => {
    onFiltersChange(prev => ({ ...prev, industry: value }));
  };

  return (
    <div className="p-2 mb-2 flex flex-wrap items-center gap-2 border-b border-gray-200/50">
      <div className="relative flex-grow min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input 
          placeholder="Search accounts..." 
          className="clay-element border-none pl-9 h-9"
          onChange={(e) => handleInputChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <Select onValueChange={handleStatusChange} defaultValue="all">
          <SelectTrigger className="clay-element border-none w-40 h-9">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="blacklisted">Blacklisted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <Select onValueChange={handleIndustryChange} defaultValue="all">
          <SelectTrigger className="clay-element border-none w-44 h-9">
            <SelectValue placeholder="Filter by Industry" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Industries</SelectItem>
            <SelectItem value="construction">Construction</SelectItem>
            <SelectItem value="hospitality">Hospitality</SelectItem>
            <SelectItem value="manufacturing">Manufacturing</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="logistics">Logistics</SelectItem>
            <SelectItem value="oil_gas">Oil & Gas</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="government">Government</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
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
