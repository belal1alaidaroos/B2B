import React, { useState, useEffect } from 'react';
import { JobProfile } from '@/api/entities';
import { SystemSetting } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, DollarSign, Briefcase, List, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CostComponentMultiSelect from '../common/CostComponentMultiSelect';
import { logAuditEvent } from '@/components/common/AuditService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function JobProfileForm({ jobProfile, jobs, skillLevels, costComponents, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    job_title: '',
    arabic_name: '',
    job_id: '',
    category: 'other',
    skill_level_id: '',
    base_cost: 0,
    default_cost_components: [],
    description: '',
    code: '',
    integration_key: '',
    from_date: '',
    to_date: '',
    active: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [systemSettings, setSystemSettings] = useState({ vatRate: 15, currency: 'SAR' });

  useEffect(() => {
    async function loadSystemSettings() {
      try {
        const settings = await SystemSetting.list();
        const vatRateSetting = settings.find(s => s.key === 'vat_rate');
        const currencySetting = settings.find(s => s.key === 'default_currency');
        setSystemSettings({
          vatRate: vatRateSetting ? parseFloat(vatRateSetting.value) : 15,
          currency: currencySetting ? currencySetting.value : 'SAR'
        });
      } catch (error) {
        console.error("Error loading system settings:", error);
        setSystemSettings({ vatRate: 15, currency: 'SAR' });
      }
    }
    loadSystemSettings();
  }, []);

  useEffect(() => {
    if (jobProfile) {
      setFormData({
        job_title: jobProfile.job_title || '',
        arabic_name: jobProfile.arabic_name || '',
        job_id: jobProfile.job_id || '',
        category: jobProfile.category || 'other',
        skill_level_id: jobProfile.skill_level_id || '',
        base_cost: jobProfile.base_cost || 0,
        default_cost_components: jobProfile.default_cost_components || [],
        description: jobProfile.description || '',
        code: jobProfile.code || '',
        integration_key: jobProfile.integration_key || '',
        from_date: jobProfile.from_date ? new Date(jobProfile.from_date).toISOString().split('T')[0] : '',
        to_date: jobProfile.to_date ? new Date(jobProfile.to_date).toISOString().split('T')[0] : '',
        active: jobProfile.active !== undefined ? jobProfile.active : true,
      });
    }
  }, [jobProfile]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const dataToSend = { ...formData };
      if (dataToSend.from_date) {
        dataToSend.from_date = new Date(dataToSend.from_date).toISOString();
      }
      if (dataToSend.to_date) {
        dataToSend.to_date = new Date(dataToSend.to_date).toISOString();
      }
      
      if (jobProfile) {
        const oldJobProfileData = { ...jobProfile };
        const updatedProfile = await JobProfile.update(jobProfile.id, dataToSend);
        await logAuditEvent({
            action: 'update',
            entityType: 'JobProfile',
            entityId: updatedProfile.id, 
            entityName: updatedProfile.job_title,
            oldValues: oldJobProfileData,
            newValues: updatedProfile
        });
      } else {
        const newProfile = await JobProfile.create(dataToSend);
        await logAuditEvent({
            action: 'create',
            entityType: 'JobProfile',
            entityId: newProfile.id,
            entityName: newProfile.job_title,
            newValues: newProfile
        });
      }
      onSave();
    } catch (error) {
      console.error("Error saving job profile:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCostComponents = costComponents.filter(c => formData.default_cost_components.includes(c.id));

  const calculateTotals = () => {
    let subtotal = 0;
    let totalVat = 0;

    subtotal += formData.base_cost || 0;

    selectedCostComponents.forEach(component => {
      let componentValue = 0;
      if (component.calculation_method === 'fixed_amount') {
        componentValue = parseFloat(component.value) || 0;
      } else if (component.calculation_method === 'percentage_of_base') {
        componentValue = (formData.base_cost * (parseFloat(component.value) || 0)) / 100;
      }
      subtotal += componentValue;
      if (component.vat_applicable) {
        totalVat += componentValue * (systemSettings.vatRate / 100);
      }
    });

    return {
      subtotal,
      totalVat,
      grandTotal: subtotal + totalVat
    };
  };

  const totals = calculateTotals();

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form Fields */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Details</TabsTrigger>
                <TabsTrigger value="costing">Costing</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="job_title">Job Profile Title *</Label>
                  <Input id="job_title" value={formData.job_title} onChange={e => handleChange('job_title', e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="arabic_name">Arabic Name</Label>
                  <Input id="arabic_name" value={formData.arabic_name} onChange={e => handleChange('arabic_name', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="job_id">Profession (Job) *</Label>
                  <Select value={formData.job_id} onValueChange={value => handleChange('job_id', value)}>
                    <SelectTrigger id="job_id"><SelectValue placeholder="Select Profession" /></SelectTrigger>
                    <SelectContent>
                      {jobs.map(job => (<SelectItem key={job.id} value={job.id}>{job.job_title}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="skill_level_id">Skill Level *</Label>
                  <Select value={formData.skill_level_id} onValueChange={value => handleChange('skill_level_id', value)}>
                    <SelectTrigger id="skill_level_id"><SelectValue placeholder="Select Skill Level" /></SelectTrigger>
                    <SelectContent>
                      {skillLevels.map(level => (<SelectItem key={level.id} value={level.id}>{level.display_name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={value => handleChange('category', value)}>
                  <SelectTrigger id="category"><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="costing" className="pt-6 space-y-6">
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="base_cost" className="flex items-center gap-2">
                          Base Monthly Cost ({systemSettings.currency}) * <Info className="w-4 h-4 text-gray-400" />
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent><p>The fundamental monthly cost before any additions.</p></TooltipContent>
                  </Tooltip>
                  <Input id="base_cost" type="number" step="0.01" value={formData.base_cost} onChange={e => handleChange('base_cost', parseFloat(e.target.value) || 0)} required />
                </div>
                <div>
                  <Label>Default Cost Components</Label>
                  <CostComponentMultiSelect
                    availableComponents={costComponents}
                    selectedComponentIds={formData.default_cost_components}
                    onChange={(ids) => handleChange('default_cost_components', ids)}
                    systemSettings={systemSettings}
                  />
                </div>
                 <div>
                    <Label htmlFor="description">Description (for Quote)</Label>
                    <Textarea id="description" value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                </div>
            </TabsContent>
            <TabsContent value="advanced" className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Code</Label>
                    <Input id="code" value={formData.code} onChange={e => handleChange('code', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="integration_key">Integration Key</Label>
                    <Input id="integration_key" value={formData.integration_key} onChange={e => handleChange('integration_key', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from_date">From Date</Label>
                    <Input id="from_date" type="date" value={formData.from_date} onChange={e => handleChange('from_date', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="to_date">To Date</Label>
                    <Input id="to_date" type="date" value={formData.to_date} onChange={e => handleChange('to_date', e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="active" checked={formData.active} onCheckedChange={c => handleChange('active', c)} />
                  <Label htmlFor="active">Job Profile is Active</Label>
                </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Live Preview */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="sticky top-4 clay-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Eye className="w-5 h-5" /> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 p-4 rounded-lg bg-gray-50 border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{formData.job_title || "Job Profile Title"}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="secondary">{formData.category}</Badge>
                      {formData.code && <Badge variant="outline">Code: {formData.code}</Badge>}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 min-h-[20px]">{formData.description || "Description will be shown here..."}</p>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium">Base Monthly Cost</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">
                    {(formData.base_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {systemSettings.currency}
                  </span>
                </div>

                <div className="border-t pt-3 space-y-2 text-sm">
                  {selectedCostComponents.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-gray-500 flex items-center gap-2 mb-1 font-semibold">
                        <List className="w-4 h-4" /> Default Costs
                      </h4>
                      <div className="pl-6 border-l ml-2 space-y-1">
                        {selectedCostComponents.map(comp => {
                          let componentValue = 0;
                          let displayValue = '';

                          if (comp.calculation_method === 'fixed_amount') {
                            componentValue = parseFloat(comp.value) || 0;
                            displayValue = `${componentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${systemSettings.currency}`;
                          } else if (comp.calculation_method === 'percentage_of_base') {
                            const percentage = parseFloat(comp.value) || 0;
                            componentValue = (formData.base_cost * percentage) / 100;
                            displayValue = `${percentage}% = ${componentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${systemSettings.currency}`;
                          }

                          return (
                            <div key={comp.id} className="flex justify-between items-center text-xs">
                              <span>{comp.name}</span>
                              <span className="font-medium">{displayValue}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Totals Summary */}
                      <div className="border-t mt-3 pt-2 space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span>Subtotal (Base + Costs)</span>
                          <span className="font-medium">{totals.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {systemSettings.currency}</span>
                        </div>
                        {totals.totalVat > 0 && (
                          <div className="flex justify-between items-center text-sm text-orange-600">
                            <span>Total VAT</span>
                            <span className="font-medium">{totals.totalVat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {systemSettings.currency}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-sm font-semibold text-green-600 border-t pt-1">
                          <span>Grand Total</span>
                          <span>{totals.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {systemSettings.currency}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Form Actions */}
        <div className="lg:col-span-3 flex justify-end gap-3 pt-4 border-t mt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSaving} className="clay-button bg-emerald-500 text-white">
            {isSaving ? 'Saving...' : 'Save Job Profile'}
          </Button>
        </div>
      </form>
    </TooltipProvider>
  );
}