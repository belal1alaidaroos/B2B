import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function PriceRequestFilters({ onFiltersChange }) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
        <Select defaultValue="all" onValueChange={(value) => onFiltersChange(prev => ({ ...prev, status: value }))}>
          <SelectTrigger id="status-filter" className="clay-element border-none mt-1">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="clay-card">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Label htmlFor="priority-filter" className="text-sm font-medium">Priority</Label>
        <Select defaultValue="all" onValueChange={(value) => onFiltersChange(prev => ({ ...prev, priority: value }))}>
          <SelectTrigger id="priority-filter" className="clay-element border-none mt-1">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent className="clay-card">
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}