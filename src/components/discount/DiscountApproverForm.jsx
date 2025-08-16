import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Save, XCircle, Percent } from 'lucide-react';

export default function DiscountApproverForm({ user, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    max_self_approve_line_discount_percent: 0,
    max_self_approve_overall_discount_percent: 0
  });

  useEffect(() => {
    if (user) {
      setFormData({
        max_self_approve_line_discount_percent: user.max_self_approve_line_discount_percent || 0,
        max_self_approve_overall_discount_percent: user.max_self_approve_overall_discount_percent || 0
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    // Ensure value is between 0 and 100
    const clampedValue = Math.max(0, Math.min(100, numValue));
    setFormData(prev => ({ ...prev, [field]: clampedValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!user) return null;

  const getApprovalLevel = () => {
    const maxDiscount = Math.max(
      formData.max_self_approve_line_discount_percent,
      formData.max_self_approve_overall_discount_percent
    );

    if (maxDiscount === 0) return { level: 'No Approval Rights', color: 'bg-gray-100 text-gray-800' };
    if (maxDiscount <= 5) return { level: 'Basic Approver', color: 'bg-blue-100 text-blue-800' };
    if (maxDiscount <= 15) return { level: 'Standard Approver', color: 'bg-green-100 text-green-800' };
    if (maxDiscount <= 30) return { level: 'Senior Approver', color: 'bg-orange-100 text-orange-800' };
    return { level: 'Executive Approver', color: 'bg-purple-100 text-purple-800' };
  };

  const approvalLevel = getApprovalLevel();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User Info */}
      <div className="flex items-center gap-3 p-4 clay-element rounded-lg">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-emerald-100 text-emerald-700">
            {user.full_name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{user.full_name}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
          {user.employee_id && (
            <p className="text-xs text-gray-500">ID: {user.employee_id}</p>
          )}
        </div>
        <Badge className={`${approvalLevel.color} border-none`}>
          {approvalLevel.level}
        </Badge>
      </div>

      {/* Approval Limits */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="line-discount" className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-purple-600" />
            Line Item Discount Approval Limit (%)
          </Label>
          <Input
            id="line-discount"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.max_self_approve_line_discount_percent}
            onChange={(e) => handleInputChange('max_self_approve_line_discount_percent', e.target.value)}
            className="clay-element border-none mt-1"
            placeholder="0.0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum percentage discount this user can approve on individual line items without escalation.
          </p>
        </div>

        <div>
          <Label htmlFor="overall-discount" className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-orange-600" />
            Overall Quote Discount Approval Limit (%)
          </Label>
          <Input
            id="overall-discount"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.max_self_approve_overall_discount_percent}
            onChange={(e) => handleInputChange('max_self_approve_overall_discount_percent', e.target.value)}
            className="clay-element border-none mt-1"
            placeholder="0.0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum percentage discount this user can approve on the entire quote without escalation.
          </p>
        </div>
      </div>

      {/* Guidelines */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-800 text-sm mb-2">Guidelines:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 0-5%: Basic approver level</li>
          <li>• 6-15%: Standard approver level</li>
          <li>• 16-30%: Senior approver level</li>
          <li>• 31%+: Executive approver level</li>
        </ul>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <XCircle className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" className="clay-button bg-emerald-500 text-white">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}