import React, { useState, useEffect } from 'react';
import { DiscountApprovalMatrix } from '@/api/entities';
import { Role } from '@/api/entities';
import { Plus, Edit, Trash2, Shield, Percent, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import DiscountApprovalRuleForm from '../components/discount/DiscountApprovalRuleForm';

export default function DiscountApprovalRulesPage() {
  const [rules, setRules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rulesData, rolesData] = await Promise.all([
        DiscountApprovalMatrix.list('-priority'),
        Role.list()
      ]);
      setRules(rulesData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Error loading discount approval rules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingRule(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleDelete = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this approval rule?')) {
      try {
        await DiscountApprovalMatrix.delete(ruleId);
        loadData();
      } catch (error) {
        console.error("Error deleting rule:", error);
      }
    }
  };

  const handleFormSave = async (ruleData) => {
    try {
      if (editingRule) {
        await DiscountApprovalMatrix.update(editingRule.id, ruleData);
      } else {
        await DiscountApprovalMatrix.create(ruleData);
      }
      setIsDialogOpen(false);
      setEditingRule(null);
      loadData();
    } catch (error) {
      console.error("Error saving rule:", error);
    }
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role?.display_name || 'Unknown Role';
  };

  const getStats = () => {
    const totalRules = rules.length;
    const activeRules = rules.filter(r => r.is_active).length;
    const lineItemRules = rules.filter(r => r.discount_type === 'line_item').length;
    const overallRules = rules.filter(r => r.discount_type === 'overall_quote').length;

    return { totalRules, activeRules, lineItemRules, overallRules };
  };

  const stats = getStats();

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Discount Approval Rules</h1>
          <p className="text-sm text-gray-600">Configure approval workflow for quote discounts based on percentage ranges.</p>
        </div>
        <Button onClick={handleAddNew} className="clay-button bg-emerald-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Approval Rule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="clay-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Rules</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalRules}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold text-green-800">{stats.activeRules}</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Line Item Rules</p>
                <p className="text-2xl font-bold text-purple-800">{stats.lineItemRules}</p>
              </div>
              <Percent className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Overall Rules</p>
                <p className="text-2xl font-bold text-orange-800">{stats.overallRules}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules Table */}
      <Card className="clay-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            All Discount Approval Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Discount Type</TableHead>
                  <TableHead>Percentage Range</TableHead>
                  <TableHead>Approver Role</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge className={`${rule.discount_type === 'line_item' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>
                        {rule.discount_type === 'line_item' ? 'Line Item' : 'Overall Quote'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {rule.min_percentage}% - {rule.max_percentage}%
                    </TableCell>
                    <TableCell>{getRoleName(rule.approver_role_id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {rule.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {rules.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No discount approval rules configured.</p>
              <p className="text-sm">Add rules to control who can approve different discount percentages.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="clay-card max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Approval Rule' : 'Add New Approval Rule'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <DiscountApprovalRuleForm
              rule={editingRule}
              availableRoles={roles}
              onSave={handleFormSave}
              onCancel={() => setIsDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}