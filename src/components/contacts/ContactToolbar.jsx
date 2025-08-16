
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, Grid3x3, List } from 'lucide-react';

export default function ContactToolbar({ viewMode, onViewModeChange, onFiltersChange }) {
  
  const handleInputChange = (value) => {
    onFiltersChange(prev => ({ ...prev, searchTerm: value }));
  };

  const handleStatusChange = (value) => {
    onFiltersChange(prev => ({ ...prev, status: value }));
  };

  const handleAuthorityChange = (value) => {
    onFiltersChange(prev => ({ ...prev, authority: value }));
  };

  // The outline did not specify changes for the "Decision Makers" select.
  // Assuming it should also manage its state if needed, but for this implementation
  // it remains as it was in the original file, without onValueChange linked to onFiltersChange.
  // If state management for this select is required, it would follow the same pattern.
  // const handleDecisionMakerChange = (value) => {
  //   onFiltersChange(prev => ({ ...prev, isDecisionMaker: value }));
  // };

  return (
    <div className="p-2 mb-2 flex flex-wrap items-center gap-2 border-b border-gray-200/50">
      <div className="relative flex-grow min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input 
          placeholder="Search contacts..." 
          className="clay-element border-none pl-9 h-9"
          onChange={(e) => handleInputChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <Select onValueChange={handleStatusChange} defaultValue="all">
          <SelectTrigger className="clay-element border-none w-36 h-9">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="do_not_contact">Do Not Contact</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <Select onValueChange={handleAuthorityChange} defaultValue="all">
          <SelectTrigger className="clay-element border-none w-40 h-9">
            <SelectValue placeholder="Filter by Authority" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="executive">Executive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Retained the "Decision Makers" select as per instruction to preserve existing features */}
      <div className="flex items-center">
        <Select>
          <SelectTrigger className="clay-element border-none w-40 h-9">
            <SelectValue placeholder="Decision Makers" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Contacts</SelectItem>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Retained view mode buttons as per instruction to preserve existing features */}
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
