import React, { useState, useEffect } from 'react';
import { Role } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Shield, Users, Search, Filter, Copy, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import RoleForm from '../components/roles/RoleForm';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rolesData, usersData] = await Promise.all([
        Role.list(),
        User.list()
      ]);
      setRoles(rolesData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading roles and users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setIsFormOpen(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setIsFormOpen(true);
  };

  const handleDuplicateRole = async (role) => {
    const duplicatedRole = {
      ...role,
      name: `${role.name}_copy`,
      display_name: `${role.display_name} (Copy)`,
      is_system: false
    };
    delete duplicatedRole.id;
    delete duplicatedRole.created_date;
    delete duplicatedRole.updated_date;
    
    try {
      await Role.create(duplicatedRole);
      setActionMessage({
        type: 'success',
        text: `Role "${role.display_name}" has been duplicated successfully.`
      });
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (error) {
      console.error("Failed to duplicate role:", error);
      setActionMessage({
        type: 'error',
        text: 'Failed to duplicate role. Please try again.'
      });
    }
  };

  const handleRoleSaved = () => {
    setIsFormOpen(false);
    setEditingRole(null);
    loadData();
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingRole(null);
  };

  const handleDeleteRole = async (roleId, isSystem, displayName) => {
    if (isSystem) {
      setActionMessage({
        type: 'error',
        text: "System roles cannot be deleted."
      });
      setTimeout(() => setActionMessage(null), 3000);
      return;
    }
    
    // Check if role is assigned to any users
    const usersWithRole = users.filter(user => user.roles?.includes(roleId));
    if (usersWithRole.length > 0) {
      setActionMessage({
        type: 'error',
        text: `Cannot delete role "${displayName}" - it is assigned to ${usersWithRole.length} user(s).`
      });
      setTimeout(() => setActionMessage(null), 5000);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the role "${displayName}"? This action cannot be undone.`)) {
      try {
        await Role.delete(roleId);
        setActionMessage({
          type: 'success',
          text: `Role "${displayName}" has been deleted successfully.`
        });
        setTimeout(() => setActionMessage(null), 3000);
        loadData();
      } catch (error) {
        console.error("Failed to delete role:", error);
        setActionMessage({
          type: 'error',
          text: 'Failed to delete role. Please try again.'
        });
      }
    }
  };

  const getRoleStats = () => {
    const totalRoles = roles.length;
    const systemRoles = roles.filter(r => r.is_system).length;
    const customRoles = roles.filter(r => !r.is_system).length;
    const rolesInUse = roles.filter(role => 
      users.some(user => user.roles?.includes(role.id))
    ).length;

    return { totalRoles, systemRoles, customRoles, rolesInUse };
  };

  const getUserCountForRole = (roleId) => {
    return users.filter(user => user.roles?.includes(roleId)).length;
  };

  const getPermissionCount = (capabilities) => {
    if (!capabilities || typeof capabilities !== 'object') return 0;
    
    let count = 0;
    Object.values(capabilities).forEach(moduleCapabilities => {
      if (typeof moduleCapabilities === 'object') {
        count += Object.values(moduleCapabilities).filter(Boolean).length;
      }
    });
    return count;
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || 
                           (categoryFilter === 'system' && role.is_system) ||
                           (categoryFilter === 'custom' && !role.is_system);
    return matchesSearch && matchesCategory;
  });

  const stats = getRoleStats();

  return (
    <div className="p-4 space-y-4 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Role Management</h1>
          <p className="text-sm text-gray-600">Define and manage user roles and their associated permissions.</p>
        </div>
        <Button 
          onClick={handleCreateRole}
          className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:scale-105 transition-transform duration-200 px-4 py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Role
        </Button>
      </div>

      {actionMessage && (
        <Alert className={`border-${actionMessage.type === 'success' ? 'green' : 'red'}-200 bg-${actionMessage.type === 'success' ? 'green' : 'red'}-50`}>
          <AlertDescription className={`text-${actionMessage.type === 'success' ? 'green' : 'red'}-800`}>
            {actionMessage.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="clay-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalRoles}</p>
              </div>
              <div className="w-10 h-10 clay-button flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">System Roles</p>
                <p className="text-2xl font-bold text-purple-800">{stats.systemRoles}</p>
              </div>
              <div className="w-10 h-10 clay-button flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Custom Roles</p>
                <p className="text-2xl font-bold text-emerald-800">{stats.customRoles}</p>
              </div>
              <div className="w-10 h-10 clay-button flex items-center justify-center">
                <Edit className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Roles in Use</p>
                <p className="text-2xl font-bold text-green-800">{stats.rolesInUse}</p>
              </div>
              <div className="w-10 h-10 clay-button flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isFormOpen && (
        <RoleForm
          role={editingRole}
          onSave={handleRoleSaved}
          onCancel={handleCancelForm}
        />
      )}

      <Card className="clay-card border-none">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              All Roles
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="clay-element border-none h-10 pl-10 w-full md:w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="clay-element border-none h-10 w-full md:w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="clay-card">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 clay-element">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRoles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No roles found</p>
                  <p className="text-sm">Try adjusting your search criteria or create a new role.</p>
                </div>
              ) : (
                filteredRoles.map((role) => (
                  <div key={role.id} className="flex items-center gap-4 p-4 clay-element hover:scale-[1.01] transition-transform duration-200">
                    <div 
                      className="w-12 h-12 flex items-center justify-center rounded-xl" 
                      style={{ backgroundColor: role.color || '#6366f1' }}
                    >
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 text-base truncate">{role.display_name}</h3>
                        {role.is_system && (
                          <Badge className="bg-blue-100 text-blue-700 border-none rounded-full text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{role.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="rounded-full text-xs">
                          {getPermissionCount(role.capabilities)} permissions
                        </Badge>
                        <Badge variant="outline" className="rounded-full text-xs flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {getUserCountForRole(role.id)} users
                        </Badge>
                        {role.priority > 0 && (
                          <Badge variant="outline" className="rounded-full text-xs">
                            Priority: {role.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDuplicateRole(role)}
                        className="h-8 w-8 hover:bg-white/50"
                        title="Duplicate role"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditRole(role)}
                        className="h-8 w-8 hover:bg-white/50"
                        title="Edit role"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteRole(role.id, role.is_system, role.display_name)}
                        className={`h-8 w-8 hover:bg-white/50 ${role.is_system ? 'opacity-50 cursor-not-allowed' : 'text-red-500'}`}
                        disabled={role.is_system}
                        title={role.is_system ? "Cannot delete system role" : "Delete role"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}