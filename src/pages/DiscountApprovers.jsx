import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Role } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Shield, 
  Users, 
  Edit, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  Percent
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import DiscountApproverForm from '../components/discount/DiscountApproverForm';

export default function DiscountApproversPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [message, setMessage] = useState(null);

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

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleFormSave = async (userData) => {
    try {
      await User.update(editingUser.id, {
        max_self_approve_line_discount_percent: userData.max_self_approve_line_discount_percent,
        max_self_approve_overall_discount_percent: userData.max_self_approve_overall_discount_percent
      });
      
      setMessage({
        type: 'success',
        text: `Discount approval limits updated for ${editingUser.full_name}`
      });
      setTimeout(() => setMessage(null), 3000);
      
      setIsDialogOpen(false);
      setEditingUser(null);
      loadData();
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage({
        type: 'error',
        text: 'Failed to update discount approval limits'
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.roles?.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  const getApprovalLevel = (user) => {
    const lineDiscount = user.max_self_approve_line_discount_percent || 0;
    const overallDiscount = user.max_self_approve_overall_discount_percent || 0;
    const maxDiscount = Math.max(lineDiscount, overallDiscount);

    if (maxDiscount === 0) return { level: 'No Approval Rights', color: 'bg-gray-100 text-gray-800' };
    if (maxDiscount <= 5) return { level: 'Basic Approver', color: 'bg-blue-100 text-blue-800' };
    if (maxDiscount <= 15) return { level: 'Standard Approver', color: 'bg-green-100 text-green-800' };
    if (maxDiscount <= 30) return { level: 'Senior Approver', color: 'bg-orange-100 text-orange-800' };
    return { level: 'Executive Approver', color: 'bg-purple-100 text-purple-800' };
  };

  const getStats = () => {
    const totalUsers = users.length;
    const usersWithApproval = users.filter(u => 
      (u.max_self_approve_line_discount_percent || 0) > 0 || 
      (u.max_self_approve_overall_discount_percent || 0) > 0
    ).length;
    const basicApprovers = users.filter(u => {
      const maxDiscount = Math.max(
        u.max_self_approve_line_discount_percent || 0,
        u.max_self_approve_overall_discount_percent || 0
      );
      return maxDiscount > 0 && maxDiscount <= 5;
    }).length;
    const seniorApprovers = users.filter(u => {
      const maxDiscount = Math.max(
        u.max_self_approve_line_discount_percent || 0,
        u.max_self_approve_overall_discount_percent || 0
      );
      return maxDiscount > 15;
    }).length;

    return { totalUsers, usersWithApproval, basicApprovers, seniorApprovers };
  };

  const stats = getStats();

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Discount Approvers Setup</h1>
          <p className="text-sm text-gray-600">Configure individual user discount approval limits and permissions.</p>
        </div>
      </div>

      {message && (
        <Alert className={`${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <AlertDescription className={`${
            message.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="clay-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">With Approval Rights</p>
                <p className="text-2xl font-bold text-green-800">{stats.usersWithApproval}</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Basic Approvers</p>
                <p className="text-2xl font-bold text-blue-800">{stats.basicApprovers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Senior Approvers</p>
                <p className="text-2xl font-bold text-purple-800">{stats.seniorApprovers}</p>
              </div>
              <Percent className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="clay-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name, email, or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="clay-element border-none h-10 pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="clay-element border-none h-10">
                  <Filter className="w-4 h-4 mr-2" />
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
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="clay-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            All Users - Discount Approval Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(8).fill(0).map((_, i) => (
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
              {filteredUsers.map((user) => {
                const approvalLevel = getApprovalLevel(user);
                return (
                  <div key={user.id} className="flex items-center gap-4 p-4 clay-element hover:scale-[1.01] transition-transform duration-200">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                        {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 text-sm truncate">
                          {user.full_name || 'Unnamed User'}
                        </h3>
                        {user.employee_id && (
                          <Badge variant="outline" className="text-xs">ID: {user.employee_id}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          Line: {user.max_self_approve_line_discount_percent || 0}%
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          Overall: {user.max_self_approve_overall_discount_percent || 0}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={`${approvalLevel.color} border-none text-xs`}>
                        {approvalLevel.level}
                      </Badge>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleEdit(user)}
                        className="clay-element border-none hover:scale-105 transition-transform duration-200 h-8 w-8"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No users found</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="clay-card max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Discount Approval Limits</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {editingUser && (
              <DiscountApproverForm
                user={editingUser}
                onSave={handleFormSave}
                onCancel={() => setIsDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}