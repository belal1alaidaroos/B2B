import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar, Users, Flag, CheckSquare } from 'lucide-react';

export default function TaskToolbar({ filters, onFiltersChange }) {
  const handleInputChange = (field, value) => {
    onFiltersChange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="clay-card p-4 mb-6 flex flex-wrap items-center gap-4">
      <div className="relative flex-grow min-w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input 
          placeholder="Search tasks by title or description..." 
          className="clay-element border-none pl-10"
          value={filters.searchTerm}
          onChange={e => handleInputChange('searchTerm', e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <CheckSquare className="w-5 h-5 text-gray-500" />
        <Select value={filters.status} onValueChange={value => handleInputChange('status', value)}>
          <SelectTrigger className="clay-element border-none w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Flag className="w-5 h-5 text-gray-500" />
        <Select value={filters.priority} onValueChange={value => handleInputChange('priority', value)}>
          <SelectTrigger className="clay-element border-none w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-gray-500" />
        <Select value={filters.assignee} onValueChange={value => handleInputChange('assignee', value)}>
          <SelectTrigger className="clay-element border-none w-36">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="me">Assigned to Me</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gray-500" />
        <Select value={filters.dueDate} onValueChange={value => handleInputChange('dueDate', value)}>
          <SelectTrigger className="clay-element border-none w-36">
            <SelectValue placeholder="Due Date" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="today">Due Today</SelectItem>
            <SelectItem value="tomorrow">Due Tomorrow</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-gray-500" />
        <Select value={filters.taskType} onValueChange={value => handleInputChange('taskType', value)}>
          <SelectTrigger className="clay-element border-none w-36">
            <SelectValue placeholder="Task Type" />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="call">Phone Call</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="follow_up">Follow Up</SelectItem>
            <SelectItem value="demo">Demo</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}