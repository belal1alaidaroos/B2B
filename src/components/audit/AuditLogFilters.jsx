import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AuditLogFilters({ filters, onFilterChange, users }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <Select value={filters.action} onValueChange={(value) => onFilterChange('action', value)}>
        <SelectTrigger className="clay-element border-none">
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Actions</SelectItem>
          <SelectItem value="create">Create</SelectItem>
          <SelectItem value="update">Update</SelectItem>
          <SelectItem value="delete">Delete</SelectItem>
          <SelectItem value="view">View</SelectItem>
          <SelectItem value="export">Export</SelectItem>
          <SelectItem value="login">Login</SelectItem>
          <SelectItem value="logout">Logout</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.entityType} onValueChange={(value) => onFilterChange('entityType', value)}>
        <SelectTrigger className="clay-element border-none">
          <SelectValue placeholder="Entity Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Entities</SelectItem>
          <SelectItem value="Lead">Leads</SelectItem>
          <SelectItem value="Opportunity">Opportunities</SelectItem>
          <SelectItem value="Account">Accounts</SelectItem>
          <SelectItem value="Contact">Contacts</SelectItem>
          <SelectItem value="Quote">Quotes</SelectItem>
          <SelectItem value="User">Users</SelectItem>
          <SelectItem value="Role">Roles</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.userId} onValueChange={(value) => onFilterChange('userId', value)}>
        <SelectTrigger className="clay-element border-none">
          <SelectValue placeholder="User" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          {users.map(user => (
            <SelectItem key={user.id} value={user.id}>
              {user.full_name || user.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.riskLevel} onValueChange={(value) => onFilterChange('riskLevel', value)}>
        <SelectTrigger className="clay-element border-none">
          <SelectValue placeholder="Risk Level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Risk Levels</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.category} onValueChange={(value) => onFilterChange('category', value)}>
        <SelectTrigger className="clay-element border-none">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="authentication">Authentication</SelectItem>
          <SelectItem value="data_modification">Data Modification</SelectItem>
          <SelectItem value="data_access">Data Access</SelectItem>
          <SelectItem value="system_configuration">System Config</SelectItem>
          <SelectItem value="security">Security</SelectItem>
          <SelectItem value="communication">Communication</SelectItem>
          <SelectItem value="financial">Financial</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.success} onValueChange={(value) => onFilterChange('success', value)}>
        <SelectTrigger className="clay-element border-none">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="success">Successful</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}