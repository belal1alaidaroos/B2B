import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function DiscountApprovalRuleForm({ rule, availableRoles, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    discount_type: 'overall_quote',
    min_percentage: 0,
    max_percentage: 0,
    approver_role_id: '',
    priority: 0,
    description: '',
    is_active: true,
    requires_escalation: false,
    escalation_role_id: '',
    auto_approve_threshold: 0
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        discount_type: rule.discount_type || 'overall_quote',
        min_percentage: rule.min_percentage || 0,
        max_percentage: rule.max_percentage || 0,
        approver_role_id: rule.approver_role_id || '',
        priority: rule.priority || 0,
        description: rule.description || '',
        is_active: rule.is_active !== undefined ? rule.is_active : true,
        requires_escalation: rule.requires_escalation || false,
        escalation_role_id: rule.escalation_role_id || '',
        auto_approve_threshold: rule.auto_approve_threshold || 0
      });
    }
  }, [rule]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.approver_role_id) {
      alert('Please fill in all required fields.');
      return;
    }

    if (formData.min_percentage >= formData.max_percentage) {
      alert('Minimum percentage must be less than maximum percentage.');
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rule-name">Rule Name *</Label>
          <Input
            id="rule-name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Manager Approval 5-15%"
          />
        </div>
        <div>
          <Label htmlFor="discount-type">Discount Type *</Label>
          <Select
            value={formData.discount_type}
            onValueChange={(value) => handleInputChange('discount_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line_item">Line Item Discount</SelectItem>
              <SelectItem value="overall_quote">Overall Quote Discount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min-percentage">Minimum Percentage *</Label>
          <Input
            id="min-percentage"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.min_percentage}
            onChange={(e) => handleInputChange('min_percentage', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label htmlFor="max-percentage">Maximum Percentage *</Label>
          <Input
            id="max-percentage"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.max_percentage}
            onChange={(e) => handleInputChange('max_percentage', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="approver-role">Approver Role *</Label>
          <Select
            value={formData.approver_role_id}
            onValueChange={(value) => handleInputChange('approver_role_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select approver role" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map(role => (
                <SelectItem key={role.id} value={role.id}>
                  {role.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Input
            id="priority"
            type="number"
            min="0"
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
            placeholder="Higher numbers = higher priority"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe when this rule applies..."
          className="h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="is-active"
            checked={formData.is_active}
            onCheckedChange={(checked) => handleInputChange('is_active', checked)}
          />
          <Label htmlFor="is-active">Rule is Active</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="requires-escalation"
            checked={formData.requires_escalation}
            onCheckedChange={(checked) => handleInputChange('requires_escalation', checked)}
          />
          <Label htmlFor="requires-escalation">Requires Escalation</Label>
        </div>
      </div>

      {formData.requires_escalation && (
        <div>
          <Label htmlFor="escalation-role">Escalation Role</Label>
          <Select
            value={formData.escalation_role_id}
            onValueChange={(value) => handleInputChange('escalation_role_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select escalation role" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map(role => (
                <SelectItem key={role.id} value={role.id}>
                  {role.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="auto-approve">Auto-Approve Threshold (%)</Label>
        <Input
          id="auto-approve"
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={formData.auto_approve_threshold}
          onChange={(e) => handleInputChange('auto_approve_threshold', parseFloat(e.target.value) || 0)}
          placeholder="Auto-approve discounts below this percentage"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="clay-button bg-emerald-500 text-white">
          Save Rule
        </Button>
      </div>
    </form>
  );
}