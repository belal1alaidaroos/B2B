
import React, { useState, useEffect } from 'react';
import { Role } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Save, XCircle, Shield, Loader2 } from 'lucide-react';

// Define standard common actions for columns
const COMMON_ACTIONS = ['create', 'read', 'update', 'delete', 'export'];

// Action display names mapping for shorter headers
const ACTION_LABELS = {
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
  export: 'Export',
  view_mobile: 'View Mobile',
  view_email: 'View Email',
  use: 'Use',
  respond: 'Respond',
  manage_roles: 'Manage Roles',
  approve: 'Approve',
  send: 'Send',
  mark_read: 'Mark Read',
  download: 'Download'
};

// Define all possible actions for each module
const moduleDefinitions = {
  dashboard: { name: 'Dashboard Overview', actions: ['read', 'export'] },
  forecasting: { name: 'Sales Forecasting', actions: ['read', 'export'] },
  leads: { name: 'Leads Management', actions: [...COMMON_ACTIONS, 'view_mobile', 'view_email'] },
  opportunities: { name: 'Opportunities Management', actions: COMMON_ACTIONS },
  accounts: { name: 'Account Management', actions: [...COMMON_ACTIONS, 'view_mobile', 'view_email'] },
  contacts: { name: 'Contact Management', actions: [...COMMON_ACTIONS, 'view_mobile', 'view_email'] },
  tasks: { name: 'Task Management', actions: COMMON_ACTIONS },
  quotes: { name: 'Quote Management', actions: COMMON_ACTIONS },
  contracts: { name: 'Contract Management', actions: COMMON_ACTIONS },
  sales_enablement: { name: 'Sales Enablement', actions: ['create', 'read', 'update', 'delete', 'download'] },
  price_requests: { name: 'Price Requests', actions: [...COMMON_ACTIONS, 'respond'] },
  communications: { name: 'Communications', actions: COMMON_ACTIONS },
  jobs: { name: 'Job Management', actions: COMMON_ACTIONS },
  users: { name: 'User Management', actions: [...COMMON_ACTIONS, 'manage_roles', 'view_mobile', 'view_email'] },
  roles: { name: 'Role Management', actions: COMMON_ACTIONS },
  settings: { name: 'System Settings', actions: ['read', 'update'] },
  pricing_engine: { name: 'Pricing Engine', actions: ['use'] },
  job_profiles: { name: 'Job Profiles Setup', actions: COMMON_ACTIONS },
  cost_components: { name: 'Cost Components Setup', actions: COMMON_ACTIONS },
  pricing_rules: { name: 'Pricing Rules Setup', actions: COMMON_ACTIONS },
  nationalities: { name: 'Nationalities Setup', actions: COMMON_ACTIONS },
  countries: { name: 'Countries Setup', actions: COMMON_ACTIONS },
  cities: { name: 'Cities Setup', actions: COMMON_ACTIONS },
  territories: { name: 'Territories Setup', actions: COMMON_ACTIONS },
  branches: { name: 'Branches Setup', actions: COMMON_ACTIONS },
  departments: { name: 'Departments Setup', actions: COMMON_ACTIONS },
  skill_levels: { name: 'Skill Levels Setup', actions: COMMON_ACTIONS },
  discount_approval_matrix: { name: 'Discount Approval Rules', actions: COMMON_ACTIONS },
  notifications: { name: 'Notifications Management', actions: ['read', 'create', 'update', 'delete', 'send', 'mark_read'] },
  audit_logs: { name: 'Audit Logs', actions: ['read', 'export'] }
};

export default function RoleForm({ role, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    capabilities: {},
    color: '#6366f1',
    priority: 0,
    is_system: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Initialize capabilities with default false values for all defined actions
    const defaultCapabilities = {};
    Object.keys(moduleDefinitions).forEach(module => {
      defaultCapabilities[module] = {};
      moduleDefinitions[module].actions.forEach(action => {
        defaultCapabilities[module][action] = false;
      });
    });

    if (role) {
      // Merge existing role capabilities with default capabilities to ensure all new actions are present
      const mergedCapabilities = { ...defaultCapabilities };
      for (const module in role.capabilities) {
        if (moduleDefinitions[module]) { // Ensure the module still exists
          mergedCapabilities[module] = {
            ...defaultCapabilities[module], // Start with defaults for this module
            ...role.capabilities[module] // Overlay existing permissions
          };
        }
      }

      setFormData({
        name: role.name || '',
        display_name: role.display_name || '',
        description: role.description || '',
        capabilities: mergedCapabilities,
        color: role.color || '#6366f1',
        priority: role.priority || 0,
        is_system: role.is_system || false,
      });
    } else {
      setFormData(prev => ({
        ...prev,
        capabilities: defaultCapabilities
      }));
    }
  }, [role]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      if (field === 'display_name' && !role) {
        updated.name = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_$/, '');
      }

      return updated;
    });
  };

  const handleCapabilityToggle = (module, action, isEnabled) => {
    setFormData(prev => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [module]: {
          ...prev.capabilities[module],
          [action]: isEnabled
        }
      }
    }));
  };

  const handleModuleToggle = (module, isEnabled) => {
    setFormData(prev => {
      const moduleCaps = {};
      // Toggle all actions defined for this module
      moduleDefinitions[module].actions.forEach(action => {
        moduleCaps[action] = isEnabled;
      });

      return {
        ...prev,
        capabilities: {
          ...prev.capabilities,
          [module]: moduleCaps
        }
      };
    });
  };

  const handleColumnToggle = (action, isEnabled) => {
    setFormData(prev => {
      const newCapabilities = { ...prev.capabilities };
      Object.keys(moduleDefinitions).forEach(moduleKey => {
        // Only toggle if the module actually supports this action
        if (moduleDefinitions[moduleKey].actions.includes(action)) {
          newCapabilities[moduleKey] = {
            ...newCapabilities[moduleKey],
            [action]: isEnabled
          };
        }
      });
      return {
        ...prev,
        capabilities: newCapabilities
      };
    });
  };

  const isModuleFullySelected = (module) => {
    // Check if all actions defined for this module are selected
    return moduleDefinitions[module].actions.every(action =>
      formData.capabilities[module]?.[action] === true
    );
  };

  const isModulePartiallySelected = (module) => {
    const definedActions = moduleDefinitions[module].actions;
    const selectedActions = definedActions.filter(action =>
      formData.capabilities[module]?.[action] === true
    );
    return selectedActions.length > 0 && selectedActions.length < definedActions.length;
  };

  const isColumnFullySelected = (action) => {
    // Check if this action is selected for all modules that support it
    return Object.keys(moduleDefinitions).every(moduleKey =>
      !moduleDefinitions[moduleKey].actions.includes(action) || // If module doesn't have action, it's 'selected'
      formData.capabilities[moduleKey]?.[action] === true
    );
  };

  const isColumnPartiallySelected = (action) => {
    const totalCount = Object.keys(moduleDefinitions).filter(moduleKey =>
      moduleDefinitions[moduleKey].actions.includes(action)
    ).length;
    const selectedCount = Object.keys(moduleDefinitions).filter(moduleKey =>
      moduleDefinitions[moduleKey].actions.includes(action) &&
      formData.capabilities[moduleKey]?.[action] === true
    ).length;
    return selectedCount > 0 && selectedCount < totalCount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (role) {
        await Role.update(role.id, formData);
      } else {
        await Role.create(formData);
      }
      onSave();
    } catch (error) {
      console.error("Failed to save role:", error);
      alert("Failed to save role. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="clay-card border-none mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800">
          {role ? 'Edit Role' : 'Create New Role'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Role Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                required
                className="clay-element border-none h-10"
                placeholder="e.g. Sales Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Role Name (Key)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                disabled={!!role}
                className="clay-element border-none h-10 disabled:bg-gray-100/80"
                placeholder="sales_manager"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="clay-element border-none h-20"
              placeholder="Describe what this role is responsible for..."
            />
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3">Module Capabilities</h3>
            <div className="border border-gray-200/80 rounded-lg">
              <div className="overflow-x-auto">
                <div className="min-w-[950px]">
                  {/* Header Row */}
                  <div className="bg-slate-50 px-2 py-2 grid grid-cols-[220px_repeat(5,80px)_250px] gap-2 items-center text-xs font-medium text-gray-600 border-b border-gray-200/50">
                    <div className="text-left pl-8">Module</div>
                    {COMMON_ACTIONS.map(action => (
                      <div key={action} className="flex flex-col items-center gap-1">
                        <span className="text-center leading-tight">{ACTION_LABELS[action]}</span>
                        <Checkbox
                          checked={isColumnFullySelected(action)}
                          onCheckedChange={(checked) => handleColumnToggle(action, checked)}
                          className={`w-3 h-3 transition-colors ${isColumnPartiallySelected(action) ? "data-[state=checked]:bg-orange-500 border-orange-500" : ""}`}
                          aria-label={`Select all ${action} permissions`}
                          id={`col-select-${action}`}
                        />
                      </div>
                    ))}
                    <div className="text-center">Other Permissions</div>
                  </div>

                  {/* Module Rows */}
                  <div className="divide-y divide-gray-200/50">
                    {Object.entries(moduleDefinitions).map(([moduleKey, moduleInfo]) => {
                      const moduleCommonActions = moduleInfo.actions.filter(action => COMMON_ACTIONS.includes(action));
                      const moduleOtherActions = moduleInfo.actions.filter(action => !COMMON_ACTIONS.includes(action));

                      return (
                        <div key={moduleKey} className="px-2 py-2 grid grid-cols-[220px_repeat(5,80px)_250px] gap-2 items-center hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-2 text-left">
                            <Checkbox
                              checked={isModuleFullySelected(moduleKey)}
                              onCheckedChange={(checked) => handleModuleToggle(moduleKey, checked)}
                              className={`w-3 h-3 transition-colors ${isModulePartiallySelected(moduleKey) ? "data-[state=checked]:bg-orange-500 border-orange-500" : ""}`}
                              aria-label={`Select all for ${moduleInfo.name}`}
                            />
                            <span className="text-sm text-gray-800 truncate" title={moduleInfo.name}>
                              {moduleInfo.name}
                            </span>
                          </div>

                          {COMMON_ACTIONS.map(action => (
                            <div key={action} className="flex justify-center">
                              {moduleCommonActions.includes(action) ? (
                                <Checkbox
                                  checked={formData.capabilities[moduleKey]?.[action] || false}
                                  onCheckedChange={(checked) => handleCapabilityToggle(moduleKey, action, checked)}
                                  className="w-3 h-3"
                                  aria-label={`${action} ${moduleInfo.name}`}
                                />
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </div>
                          ))}

                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {moduleOtherActions.length > 0 ? (
                              moduleOtherActions.map(action => (
                                <div key={action} className="flex items-center gap-1.5">
                                  <Checkbox
                                    checked={formData.capabilities[moduleKey]?.[action] || false}
                                    onCheckedChange={(checked) => handleCapabilityToggle(moduleKey, action, checked)}
                                    className="w-3 h-3"
                                    aria-label={`${action} ${moduleInfo.name}`}
                                  />
                                  <span className="text-xs text-gray-700 truncate" title={ACTION_LABELS[action] || action}>
                                    {ACTION_LABELS[action] || action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs text-center">-</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel} className="hover:bg-white/50 px-6">
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Role
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
