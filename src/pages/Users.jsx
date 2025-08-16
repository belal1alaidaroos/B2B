
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';
import { Role } from '@/api/entities';
import { Users as UsersIcon, Plus, Edit, Shield, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logAuditEvent } from '@/components/common/AuditService'; // Import the audit service

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        User.list(),
        Role.list()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Error loading users and roles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserStatusToggle = async (user, newStatus) => {
    try {
      await User.update(user.id, { status: newStatus });
      
      // Log the user status change
      await logAuditEvent({
        action: 'update',
        entityType: 'User',
        entityId: user.id,
        entityName: user.full_name || user.email,
        oldValues: { status: user.status },
        newValues: { status: newStatus },
        success: true,
      });
      
      setActionMessage({
        type: 'success',
        text: `User ${user.full_name} has been ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`
      });
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (error) {
      console.error("Failed to update user status:", error);
      
      // Log the failed attempt
      await logAuditEvent({
        action: 'update',
        entityType: 'User',
        entityId: user.id,
        entityName: user.full_name || user.email,
        oldValues: { status: user.status },
        newValues: { status: newStatus },
        success: false,
        errorMessage: error.message,
      });
      
      setActionMessage({
        type: 'error',
        text: 'Failed to update user status. Please try again.'
      });
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  // Removed handleBulkStatusUpdate as bulk actions are no longer in the UI

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.roles?.includes(roleFilter);
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getUserStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const inactiveUsers = users.filter(u => u.status === 'inactive').length;
    const suspendedUsers = users.filter(u => u.status === 'suspended').length;
    const adminRole = roles.find(r => r.display_name?.toLowerCase().includes('admin'));
    const adminUsers = adminRole ? users.filter(u => u.roles?.includes(adminRole.id)).length : 0;

    return { totalUsers, activeUsers, inactiveUsers, suspendedUsers, adminUsers };
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.pending;
  };

  const stats = getUserStats();

  return (
    <div className="p-4 space-y-4 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">User Management</h1>
          <p className="text-sm text-gray-600">Manage user accounts, roles, and permissions.</p>
        </div>
        <div className="flex gap-2">
          {/* Removed Activate All and Deactivate All buttons */}
          <Button className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:scale-105 transition-transform duration-200 px-4 py-2">
            <Plus className="w-4 h-4 mr-2" />
            Add New User
          </Button>
        </div>
      </div>

      {actionMessage && (
        <Alert className={`border-${actionMessage.type === 'success' ? 'green' : actionMessage.type === 'error' ? 'red' : 'blue'}-200 bg-${actionMessage.type === 'success' ? 'green' : actionMessage.type === 'error' ? 'red' : 'blue'}-50`}>
          <AlertDescription className={`text-${actionMessage.type === 'success' ? 'green' : actionMessage.type === 'error' ? 'red' : 'blue'}-800`}>
            {actionMessage.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="clay-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
              </div>
              <div className="w-10 h-10 clay-button flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-800">{stats.activeUsers}</p>
              </div>
              <div className="w-10 h-10 clay-button flex items-center justify-center">
                <Power className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-800">{stats.inactiveUsers}</p>
              </div>
              <div className="w-10 h-10 clay-button flex items-center justify-center">
                <PowerOff className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-red-800">{stats.suspendedUsers}</p>
              </div>
              <div className="w-10 h-10 clay-button flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Administrators</p>
                <p className="text-2xl font-bold text-purple-800">{stats.adminUsers}</p>
              </div>
              <div className="w-10 h-10 clay-button flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card className="clay-card border-none">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="clay-element border-none h-10"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="clay-element border-none h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="clay-card border-none">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="clay-element border-none h-10">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="clay-card border-none">
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Enhanced Users Table */}
          {isLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 clay-element">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-16 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <Link key={user.id} to={createPageUrl(`UserDetail?id=${user.id}`)} className="block">
                  <div className="flex items-center gap-4 p-4 clay-element hover:scale-[1.01] transition-transform duration-200 cursor-pointer">
                    <div className="w-12 h-12 clay-button flex items-center justify-center">
                      <span className="font-bold text-emerald-700">
                        {user.full_name?.charAt(0)?.toUpperCase() || user.first_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 text-sm truncate">
                          {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User'}
                        </h3>
                        {user.employee_id && (
                          <Badge variant="outline" className="text-xs">ID: {user.employee_id}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      {user.job_title && (
                        <p className="text-xs text-gray-500 truncate">{user.job_title}</p>
                      )}
                      {user.mobile && (
                        <p className="text-xs text-gray-500 truncate">{user.mobile}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 min-w-0">
                      <Badge className={`${getStatusColor(user.status)} border-none text-xs`}>
                        {user.status || 'pending'}
                      </Badge>
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.slice(0, 2).map((roleId) => {
                          const role = roles.find(r => r.id === roleId);
                          return role ? (
                            <Badge 
                              key={role.id} 
                              className="text-xs border-none" 
                              style={{ backgroundColor: role.color + '20', color: role.color }}
                            >
                              {role.display_name}
                            </Badge>
                          ) : null;
                        })}
                        {user.roles?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.roles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-500">Status</span>
                        <Switch
                          checked={user.status === 'active'}
                          onCheckedChange={(checked) => {
                            // Prevent navigation when clicking switch
                            event.stopPropagation();
                            event.preventDefault();
                            handleUserStatusToggle(user, checked ? 'active' : 'inactive')
                          }}
                          className="data-[state=checked]:bg-green-600"
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={(e) => e.preventDefault()} // Prevent link navigation
                        className="clay-element border-none hover:scale-105 transition-transform duration-200 h-8 w-8"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <UsersIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No users found</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
