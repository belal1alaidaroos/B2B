import React, { useState, useEffect } from 'react';
import { Permission } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Save, XCircle } from 'lucide-react';

const actionOptions = [
  { value: 'create', label: 'Create' },
  { value: 'read', label: 'Read' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'export', label: 'Export' },
  { value: 'import', label: 'Import' },
  { value: 'manage', label: 'Manage' }
];

const categoryOptions = [
  { value: 'core', label: 'Core System' },
  { value: 'sales', label: 'Sales & CRM' },
  { value: 'operations', label: 'Operations' },
  { value: 'admin', label: 'Administration' },
  { value: 'other', label: 'Other' }
];

export default function PermissionForm({ permission, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    component_name: '',
    action: '',
    permission_key: '',
    display_name: '',
    description: '',
    category: 'other',
    is_system: false,
  });

  useEffect(() => {
    if (permission) {
      setFormData({
        component_name: permission.component_name || '',
        action: permission.action || '',
        permission_key: permission.permission_key || '',
        display_name: permission.display_name || '',
        description: permission.description || '',
        category: permission.category || 'other',
        is_system: permission.is_system || false,
      });
    }
  }, [permission]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate permission_key when component_name or action changes
      if (field === 'component_name' || field === 'action') {
        updated.permission_key = `${updated.component_name}.${updated.action}`;
      }
      
      // Auto-generate display_name when component_name or action changes
      if (field === 'component_name' || field === 'action') {
        const actionLabel = actionOptions.find(a => a.value === updated.action)?.label || updated.action;
        updated.display_name = `${actionLabel} ${updated.component_name?.charAt(0).toUpperCase() + updated.component_name?.slice(1)}`;
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (permission) {
        await Permission.update(permission.id, formData);
      } else {
        await Permission.create(formData);
      }
      onSave();
    } catch (error) {
      console.error("Failed to save permission:", error);
      alert("Failed to save permission. Please try again.");
    }
  };

  return (
    <Card className="clay-card border-none mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800">
          {permission ? 'Edit Permission' : 'Create New Permission'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="component_name" className="text-sm font-medium text-gray-700">Component Name</Label>
              <Input
                id="component_name"
                type="text"
                value={formData.component_name}
                onChange={(e) => handleChange('component_name', e.target.value)}
                className="clay-element border-none h-10"
                placeholder="e.g., accounts, leads, users"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action" className="text-sm font-medium text-gray-700">Action</Label>
              <Select value={formData.action} onValueChange={(value) => handleChange('action', value)}>
                <SelectTrigger className="clay-element border-none h-10">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent className="clay-card border-none">
                  {actionOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="permission_key" className="text-sm font-medium text-gray-700">Permission Key</Label>
              <Input
                id="permission_key"
                type="text"
                value={formData.permission_key}
                onChange={(e) => handleChange('permission_key', e.target.value)}
                className="clay-element border-none h-10"
                placeholder="auto-generated"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger className="clay-element border-none h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="clay-card border-none">
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-sm font-medium text-gray-700">Display Name</Label>
            <Input
              id="display_name"
              type="text"
              value={formData.display_name}
              onChange={(e) => handleChange('display_name', e.target.value)}
              className="clay-element border-none h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="clay-element border-none resize-none h-24"
              placeholder="Describe what this permission allows..."
            />
          </div>

          <div className="flex items-center justify-between p-4 clay-element rounded-xl">
            <div>
              <Label htmlFor="is_system" className="text-sm font-medium text-gray-700">System Permission</Label>
              <p className="text-xs text-gray-500">System permissions cannot be deleted and are managed automatically.</p>
            </div>
            <Switch
              id="is_system"
              checked={formData.is_system}
              onCheckedChange={(checked) => handleChange('is_system', checked)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="hover:bg-white/50 px-6"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Permission
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}