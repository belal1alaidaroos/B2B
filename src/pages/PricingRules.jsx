
import React, { useState, useEffect } from 'react';
import { PricingRule } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, GitBranch, Power, PowerOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PricingRuleForm from '../components/pricing_setup/PricingRuleForm';
import { logAuditEvent } from '@/components/common/AuditService';

export default function PricingRulesPage() {
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const data = await PricingRule.list('-priority');
      setRules(data);
    } catch (error) {
      console.error("Error loading pricing rules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSave = async () => {
    setIsFormOpen(false);
    setSelectedRule(null);
    loadRules();
  };

  const handleAddNew = () => {
    setSelectedRule(null);
    setIsFormOpen(true);
  };

  const handleEdit = (rule) => {
    setSelectedRule(rule);
    setIsFormOpen(true);
  };

  const handleToggleActive = async (rule) => {
    try {
      const newStatus = !rule.is_active;
      await PricingRule.update(rule.id, { ...rule, is_active: newStatus });
      await logAuditEvent({
        action: 'update',
        entityType: 'PricingRule',
        entityId: rule.id,
        entityName: rule.name,
        oldValues: { is_active: rule.is_active },
        newValues: { is_active: newStatus }
      });
      loadRules();
    } catch (error) {
      console.error("Error updating rule status:", error);
      alert('Failed to update rule status.');
    }
  };

  const handleDelete = async (id) => {
    const ruleToDelete = rules.find(r => r.id === id); // Find the rule before it's potentially removed from state
    if (confirm('Are you sure you want to delete this pricing rule? This action cannot be undone.')) {
      try {
        await PricingRule.delete(id);
        if (ruleToDelete) { // Ensure ruleToDelete exists before logging
          await logAuditEvent({
            action: 'delete',
            entityType: 'PricingRule',
            entityId: id,
            entityName: ruleToDelete.name,
            oldValues: ruleToDelete
          });
        }
        loadRules();
      } catch (error) {
        console.error("Error deleting pricing rule:", error);
        alert('Failed to delete rule.');
      }
    }
  };

  const getRuleStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    if (priority >= 100) return 'bg-red-100 text-red-800';
    if (priority >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pricing Rules</h1>
          <p className="text-sm text-gray-600">Define conditions and actions for dynamic pricing calculations.</p>
        </div>
        <Button onClick={handleAddNew} className="clay-button bg-emerald-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add New Rule
        </Button>
      </div>
      
      <Card className="clay-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-emerald-600" />
            All Pricing Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse p-3 clay-element rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>English Name</TableHead>
                  <TableHead>Arabic Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Integration Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>From Date</TableHead>
                  <TableHead>To Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell className="font-arabic">{rule.arabic_name || '-'}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {rule.code || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(rule.priority)}>
                        {rule.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.conditions?.all?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.actions?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{rule.integration_key || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getRuleStatusColor(rule.is_active)}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{rule.from_date || '-'}</TableCell>
                    <TableCell className="text-sm">{rule.to_date || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleToggleActive(rule)}
                        className={rule.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {rule.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No pricing rules found. Add your first rule to start automating your pricing logic.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[80vw] lg:max-w-4xl clay-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRule ? 'Edit Pricing Rule' : 'Add New Pricing Rule'}</DialogTitle>
            <DialogDescription>
              {selectedRule ? 'Update the conditions and actions for this pricing rule.' : 'Create a new pricing rule to automate cost calculations.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <PricingRuleForm
              rule={selectedRule}
              onSave={handleFormSave}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
