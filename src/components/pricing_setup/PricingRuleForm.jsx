import React, { useState, useEffect } from 'react';
import { PricingRule } from '@/api/entities';
import { CostComponent } from '@/api/entities';
import { Nationality } from '@/api/entities';
import { City } from '@/api/entities';
import { JobProfile } from '@/api/entities';
import { Job } from '@/api/entities';
import { SkillLevel } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, XCircle, Loader2, Plus, Trash2, GitBranch, Shield, Info, HelpCircle, ArrowRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { logAuditEvent } from '@/components/common/AuditService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const conditionOperators = {
    'select': [
        { value: 'equal', label: 'Equals' },
        { value: 'not_equal', label: 'Does Not Equal' },
        { value: 'in', label: 'Is One Of' },
        { value: 'contains', label: 'Contains' },
        { value: 'starts_with', label: 'Starts With' },
    ],
    'number': [
        { value: 'equal', label: '=' },
        { value: 'not_equal', label: '!=' },
        { value: 'greater_than', label: '>' },
        { value: 'less_than', label: '<' },
        { value: 'greater_than_or_equal', label: '>=' },
        { value: 'less_than_or_equal', label: '<=' },
        { value: 'between', label: 'Between' },
    ]
};

const actionTypes = [
  { value: 'add_cost_component', label: 'Add Cost Component' },
  { value: 'apply_markup_percentage', label: 'Apply Markup (%)' },
  { value: 'apply_discount_percentage', label: 'Apply Discount (%)' },
];

export default function PricingRuleForm({ rule, onSave, onCancel }) {
  const [formData, setFormData] = useState({ 
    name: '', 
    arabic_name: '',
    description: '', 
    code: '',
    priority: 0, 
    integration_key: '',
    is_active: true,
    stop_if_matched: false,
    from_date: '',
    to_date: '',
    conditions: { all: [] },
    actions: []
  });
  const [availableComponents, setAvailableComponents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [conditionFacts, setConditionFacts] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [components, nationalities, cities, jobProfiles, jobs, skillLevels] = await Promise.all([
          CostComponent.list(),
          Nationality.filter({ is_active: true }),
          City.filter({ is_active: true }),
          JobProfile.filter({ active: true }),
          Job.filter({ is_active: true }),
          SkillLevel.filter({ is_active: true }),
        ]);
        
        setAvailableComponents(components);

        const baseFacts = [
          { value: 'lead.industry', label: 'Lead Industry', type: 'select', options: ["construction", "hospitality", "manufacturing", "healthcare", "retail", "logistics", "oil_gas", "technology", "other"].map(o => ({value:o, label:o.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())})) },
          { value: 'lead.source', label: 'Lead Source', type: 'select', options: ["website", "referral", "cold_call", "social_media", "event", "partner", "other"].map(o => ({value:o, label:o.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())})) },
          { value: 'line_item.job_category', label: 'Job Category', type: 'select', options: ["construction", "hospitality", "healthcare", "manufacturing", "logistics", "technical", "administrative", "other"].map(o => ({value:o, label:o.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())}))},
          { value: 'line_item.quantity', label: 'Line Item Quantity', type: 'number' },
          { value: 'line_item.contract_duration', label: 'Contract Duration (months)', type: 'number' },
        ];

        const nationalityFact = { value: 'line_item.nationality', label: 'Nationality', type: 'select', options: nationalities.map(n => ({ value: n.name, label: n.name })) };
        const jobFact = { value: 'line_item.job_id', label: 'Job (Profession)', type: 'select', options: jobs.map(j => ({ value: j.id, label: j.job_title })) };
        const jobProfileFact = { value: 'line_item.job_profile_id', label: 'Job Profile', type: 'select', options: jobProfiles.map(jp => ({ value: jp.id, label: jp.job_title })) };
        const skillLevelFact = { value: 'line_item.skill_level_id', label: 'Skill Level', type: 'select', options: skillLevels.map(sl => ({ value: sl.id, label: sl.name })) };
        const locationFact = { value: 'line_item.location', label: 'Location (City)', type: 'select', options: cities.map(c => ({ value: c.name, label: c.name })) };

        setConditionFacts([...baseFacts, nationalityFact, jobFact, jobProfileFact, skillLevelFact, locationFact]);
      } catch (error) {
        console.error("Error loading data for pricing rule form:", error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        arabic_name: rule.arabic_name || '',
        description: rule.description || '',
        code: rule.code || '',
        priority: rule.priority || 0,
        integration_key: rule.integration_key || '',
        is_active: rule.is_active !== undefined ? rule.is_active : true,
        stop_if_matched: rule.stop_if_matched !== undefined ? rule.stop_if_matched : false,
        from_date: rule.from_date || '',
        to_date: rule.to_date || '',
        conditions: rule.conditions || { all: [] },
        actions: rule.actions || []
      });
    }
  }, [rule]);

  const handleConditionChange = (index, field, value) => {
    const newConditions = { ...formData.conditions };
    newConditions.all[index][field] = value;
    if (field === 'fact') {
        newConditions.all[index]['operator'] = '';
        newConditions.all[index]['value'] = '';
    }
    setFormData(prev => ({...prev, conditions: newConditions}));
  };

  const addCondition = () => {
    const newConditions = { ...formData.conditions, all: [...(formData.conditions?.all || []), { fact: '', operator: '', value: '' }]};
    setFormData(prev => ({...prev, conditions: newConditions}));
  };

  const removeCondition = (index) => {
    const newConditions = { ...formData.conditions, all: formData.conditions.all.filter((_, i) => i !== index)};
    setFormData(prev => ({...prev, conditions: newConditions}));
  };
  
  const handleActionChange = (index, field, value) => {
    const newActions = [...formData.actions];
    newActions[index][field] = value;
    if(field === 'type'){ newActions[index]['params'] = {}; }
    setFormData(prev => ({...prev, actions: newActions}));
  };

  const handleActionParamChange = (index, paramName, value) => {
    const newActions = [...formData.actions];
    if (!newActions[index].params) newActions[index].params = {};
    newActions[index].params[paramName] = value;
    setFormData(prev => ({...prev, actions: newActions}));
  }

  const addAction = () => {
    const newActions = [...formData.actions, { type: '', params: {} }];
    setFormData(prev => ({...prev, actions: newActions}));
  };

  const removeAction = (index) => {
    const newActions = formData.actions.filter((_, i) => i !== index);
    setFormData(prev => ({...prev, actions: newActions}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const dataToSave = {
      ...formData,
      priority: parseInt(formData.priority, 10),
    };

    try {
      if (rule) {
        const updatedRule = await PricingRule.update(rule.id, dataToSave);
        await logAuditEvent({
            action: 'update',
            entityType: 'PricingRule',
            entityId: rule.id,
            entityName: updatedRule.name,
            oldValues: rule,
            newValues: updatedRule
        });
      } else {
        const newRule = await PricingRule.create(dataToSave);
        await logAuditEvent({
            action: 'create',
            entityType: 'PricingRule',
            entityId: newRule.id,
            entityName: newRule.name,
            newValues: newRule
        });
      }
      onSave();
    } catch (error) {
      console.error("Error saving pricing rule:", error);
      alert('Failed to save rule.');
    } finally {
      setIsSaving(false);
    }
  };

  const getOperatorsForFact = (factKey) => {
      const fact = conditionFacts.find(f => f.value === factKey);
      if(!fact) return [];
      return conditionOperators[fact.type] || [];
  }

  const renderValueInput = (condition, index) => {
    const fact = conditionFacts.find(f => f.value === condition.fact);
    if (!fact) return null;

    if (fact.type === 'number' && condition.operator === 'between') {
      return (
        <div className="flex gap-2">
          <Input type="number" value={condition.value?.[0] || ''} onChange={(e) => handleConditionChange(index, 'value', [e.target.value, condition.value?.[1]])} placeholder="From..."/>
          <Input type="number" value={condition.value?.[1] || ''} onChange={(e) => handleConditionChange(index, 'value', [condition.value?.[0], e.target.value])} placeholder="To..."/>
        </div>
      );
    }

    if (fact.type === 'select') {
      return (
        <Select value={condition.value} onValueChange={(v) => handleConditionChange(index, 'value', v)}>
          <SelectTrigger><SelectValue placeholder="Select value..."/></SelectTrigger>
          <SelectContent>
            {fact.options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    }
    if (fact.type === 'number') {
      return <Input type="number" value={condition.value} onChange={(e) => handleConditionChange(index, 'value', e.target.value)} placeholder="Enter a number..."/>;
    }
    return <Input value={condition.value} onChange={(e) => handleConditionChange(index, 'value', e.target.value)} placeholder="Enter a value..."/>;
  };
  
  const renderActionParams = (action, index) => {
    switch (action.type) {
      case 'add_cost_component':
        return (
          <Select value={action.params?.component_id || ''} onValueChange={(v) => handleActionParamChange(index, 'component_id', v)}>
            <SelectTrigger><SelectValue placeholder="Select Cost Component"/></SelectTrigger>
            <SelectContent>
              {availableComponents.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case 'apply_markup_percentage':
      case 'apply_discount_percentage':
        return <Input type="number" placeholder="Enter percentage..." value={action.params?.value || ''} onChange={(e) => handleActionParamChange(index, 'value', e.target.value)}/>;
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Rule Details</TabsTrigger>
                <TabsTrigger value="conditions">Conditions (IF)</TabsTrigger>
                <TabsTrigger value="actions">Actions (THEN)</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="name">Rule Name *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
                  <div><Label htmlFor="arabic_name">Arabic Name</Label><Input id="arabic_name" value={formData.arabic_name} onChange={(e) => setFormData({...formData, arabic_name: e.target.value})} /></div>
                  <div><Label htmlFor="description">Description</Label><Input id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
                  <div><Label htmlFor="code">Rule Code</Label><Input id="code" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} /></div>
                  <div><Label htmlFor="priority">Priority *</Label><Input id="priority" type="number" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} required /></div>
                  <div><Label htmlFor="integration_key">Integration Key</Label><Input id="integration_key" value={formData.integration_key} onChange={(e) => setFormData({...formData, integration_key: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>From Date</Label><Input type="date" value={formData.from_date} onChange={(e) => setFormData({...formData, from_date: e.target.value})} /></div>
                  <div><Label>To Date</Label><Input type="date" value={formData.to_date} onChange={(e) => setFormData({...formData, to_date: e.target.value})} /></div>
                </div>
                <div className="flex items-center space-x-2"><Switch id="is_active" checked={formData.is_active} onCheckedChange={(c) => setFormData({...formData, is_active: c})} /><Label htmlFor="is_active">Is Active</Label></div>
                <div className="flex items-center space-x-2">
                    <Switch id="stop_if_matched" checked={formData.stop_if_matched} onCheckedChange={(c) => setFormData({...formData, stop_if_matched: c})} />
                    <Tooltip><TooltipTrigger asChild><Label htmlFor="stop_if_matched" className="flex items-center gap-1 cursor-help">Stop if matched <HelpCircle className="w-4 h-4 text-gray-400" /></Label></TooltipTrigger><TooltipContent><p>If on, no lower-priority rules will be checked after this one matches.</p></TooltipContent></Tooltip>
                </div>
            </TabsContent>
            <TabsContent value="conditions" className="pt-6">
                <Card className="clay-card">
                  <CardHeader><CardTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5 text-emerald-600"/> Conditions</CardTitle><CardDescription>All these conditions must be true (AND) for the rule to apply.</CardDescription></CardHeader>
                  <CardContent className="space-y-3">
                    {formData.conditions?.all?.map((cond, index) => (
                      <div key={index} className="flex flex-col md:flex-row items-center gap-2 p-3 bg-white/50 rounded-lg">
                        <Select value={cond.fact} onValueChange={(v) => handleConditionChange(index, 'fact', v)}><SelectTrigger className="flex-1"><SelectValue placeholder="Select condition..."/></SelectTrigger><SelectContent>{conditionFacts.map(fact => <SelectItem key={fact.value} value={fact.value}>{fact.label}</SelectItem>)}</SelectContent></Select>
                        <Select value={cond.operator} onValueChange={(v) => handleConditionChange(index, 'operator', v)}><SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Operator..."/></SelectTrigger><SelectContent>{getOperatorsForFact(cond.fact).map(op => <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>)}</SelectContent></Select>
                        <div className="flex-1 w-full">{renderValueInput(cond, index)}</div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeCondition(index)}><Trash2 className="w-4 h-4 text-red-500"/></Button>
                      </div>
                    ))}
                     <Button type="button" variant="outline" size="sm" onClick={addCondition}><Plus className="w-4 h-4 mr-2"/> Add Condition</Button>
                  </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="actions" className="pt-6">
                <Card className="clay-card">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-600"/> Actions</CardTitle><CardDescription>These actions will be executed when the conditions are met.</CardDescription></CardHeader>
                    <CardContent className="space-y-3">
                        {formData.actions.map((act, index) => (
                          <div key={index} className="flex flex-col md:flex-row items-center gap-2 p-3 bg-white/50 rounded-lg">
                              <Select value={act.type} onValueChange={(v) => handleActionChange(index, 'type', v)}><SelectTrigger className="flex-1"><SelectValue placeholder="Select an action..."/></SelectTrigger><SelectContent>{actionTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select>
                              <div className="flex-1 w-full">{renderActionParams(act, index)}</div>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeAction(index)}><Trash2 className="w-4 h-4 text-red-500"/></Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addAction}><Plus className="w-4 h-4 mr-2"/> Add Action</Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button type="button" variant="ghost" onClick={onCancel}><XCircle className="w-4 h-4 mr-2" /> Cancel</Button>
          <Button type="submit" disabled={isSaving} className="clay-button bg-emerald-500 text-white"><Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save Rule'}</Button>
        </div>
      </form>
    </TooltipProvider>
  );
}