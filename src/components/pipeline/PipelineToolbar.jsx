import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, UserPlus } from 'lucide-react';

export default function PipelineToolbar({ onFiltersChange }) {
  const handleInputChange = (value) => {
    onFiltersChange(prev => ({ ...prev, searchTerm: value }));
  };

  const handlePriorityChange = (value) => {
    onFiltersChange(prev => ({ ...prev, priority: value }));
  };

  const handleOwnerChange = (value) => {
    onFiltersChange(prev => ({ ...prev, owner: value }));
  };

  return (
    <div className="clay-card p-4 mb-6 flex flex-wrap items-center gap-4">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input 
          placeholder="Search leads by company or contact..." 
          className="clay-element border-none pl-10"
          onChange={e => handleInputChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-gray-500" />
        <Select onValueChange={handlePriorityChange} defaultValue="all">
          <SelectTrigger className="clay-element border-none w-40">
            <SelectValue placeholder="Filter by Priority" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-gray-500" />
        <Select onValueChange={handleOwnerChange} defaultValue="all">
          <SelectTrigger className="clay-element border-none w-40">
            <SelectValue placeholder="Filter by Owner" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Owners</SelectItem>
            <SelectItem value="me">Assigned to Me</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}