import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, UserPlus } from 'lucide-react';

export default function OpportunityToolbar({ onFiltersChange }) {

  const handleInputChange = (value) => {
    onFiltersChange(prev => ({ ...prev, searchTerm: value }));
  };

  const handleStageChange = (value) => {
    onFiltersChange(prev => ({ ...prev, stage: value }));
  };

  const handleOwnerChange = (value) => {
    onFiltersChange(prev => ({ ...prev, owner: value }));
  };

  return (
    <div className="clay-card p-4 mb-6 flex flex-wrap items-center gap-4">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input 
          placeholder="Search by opportunity name or number..." 
          className="clay-element border-none pl-10" 
          onChange={(e) => handleInputChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-gray-500" />
        <Select onValueChange={handleStageChange} defaultValue="all">
          <SelectTrigger className="clay-element border-none w-48">
            <SelectValue placeholder="Filter by Stage" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="qualification">Qualification</SelectItem>
            <SelectItem value="needs_analysis">Needs Analysis</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="negotiation">Negotiation</SelectItem>
            <SelectItem value="closed_won">Closed Won</SelectItem>
            <SelectItem value="closed_lost">Closed Lost</SelectItem>
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