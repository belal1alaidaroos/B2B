import React, { useState, useEffect } from 'react';
import { CostComponent } from '@/api/entities';
import { Nationality } from '@/api/entities';
import { SystemSetting } from '@/api/entities';
import { JobProfile } from '@/api/entities';
import { Job } from '@/api/entities';
import { City } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Plus, Trash2, RefreshCw, Info, Zap, DollarSign } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { logAuditEvent } from '@/components/common/AuditService';

const conditionFacts = [
  { value: 'line_item.nationality', label: 'Nationality', type: 'select', source: 'nationalities' },
  { value: 'line_item.job_category', label: 'Job Category', type: 'select', source: 'jobCategories' },
  { value: 'line_item.location', label: 'Location (City)', type: 'select', source: 'cities' },
  { value: 'line_item.job_profile_id', label: 'Job Profile', type: 'select', source: 'jobProfiles' },
  { value: 'line_item.job_id', label: 'Job (Profession)', type: 'select', source: 'jobs' },
  { value: 'line_item.quantity', label: 'Quantity', type: 'number' },
  { value: 'line_item.contract_duration', label: 'Contract Duration (Months)', type: 'number' },
  { value: 'lead.industry', label: 'Client Industry', type: 'select', source: 'industries' }
];

const operators = [
  { value: 'equal', label: 'Equals', types: ['select', 'number'] },
  { value: 'not_equal', label: 'Not Equal', types: ['select', 'number'] },
  { value: 'greater_than', label: 'Greater Than', types: ['number'] },
  { value: 'less_than', label: 'Less Than', types: ['number'] },
  { value: 'greater_than_or_equal', label: 'Greater Than or Equal', types: ['number'] },
  { value: 'less_than_or_equal', label: 'Less Than or Equal', types: ['number'] },
  { value: 'in', label: 'Is One Of', types: ['select'] }
];

const getInitialFormData = (component) => ({
    name: component?.name || '',
    arabic_name: component?.arabic_name || '',
    description: component?.description || '',
    code: component?.code || '',
    type: component?.type || 'allowance',
    calculation_method: component?.calculation_method || 'fixed_amount',
    value: component?.value || 0,
    currency: component?.currency || 'SAR',
    periodicity: component?.periodicity || 'monthly',
    vat_applicable: component?.vat_applicable !== undefined ? component.vat_applicable : false,
    scope: component?.scope || 'line_item',
    category: component?.category || 'personnel_cost',
    applicable_for: component?.applicable_for || ['job_profile'],
    conditions: component?.conditions || null,
    integration_key: component?.integration_key || '',
    is_active: component?.is_active !== undefined ? component.is_active : true,
    from_date: component?.from_date ? new Date(component.from_date).toISOString().split('T')[0] : '',
    to_date: component?.to_date ? new Date(component.to_date).toISOString().split('T')[0] : ''
});

export default function CostComponentForm({ component, onSave, onCancel }) {
    const [formData, setFormData] = useState(getInitialFormData(component));
    const [originalFormData] = useState(getInitialFormData(component));
    const [isSaving, setIsSaving] = useState(false);
    const [systemSettings, setSystemSettings] = useState({ vatRate: 15, currency: 'SAR' });
    const [previewData, setPreviewData] = useState({
        baseCost: 1000,
        quantity: 1
    });
    
    const [conditionData, setConditionData] = useState({
        nationalities: [],
        jobCategories: [
            { value: 'construction', label: 'Construction' },
            { value: 'hospitality', label: 'Hospitality' },
            { value: 'healthcare', label: 'Healthcare' },
            { value: 'manufacturing', label: 'Manufacturing' },
            { value: 'logistics', label: 'Logistics' },
            { value: 'technical', label: 'Technical' },
            { value: 'administrative', label: 'Administrative' },
            { value: 'other', label: 'Other' }
        ],
        cities: [],
        jobs: [],
        jobProfiles: [],
        industries: [
            { value: 'construction', label: 'Construction' },
            { value: 'hospitality', label: 'Hospitality' },
            { value: 'manufacturing', label: 'Manufacturing' },
            { value: 'healthcare', label: 'Healthcare' },
            { value: 'retail', label: 'Retail' },
            { value: 'logistics', label: 'Logistics' },
            { value: 'oil_gas', label: 'Oil & Gas' },
            { value: 'technology', label: 'Technology' },
            { value: 'other', label: 'Other' }
        ]
    });

    useEffect(() => {
        async function loadDropdownData() {
            try {
                const [nationalities, jobProfilesData, cities, settings, jobsData] = await Promise.all([
                    Nationality.list(),
                    JobProfile.list(),
                    City.list(),
                    SystemSetting.list(),
                    Job.list()
                ]);

                const vatRateSetting = settings.find(s => s.key === 'vat_rate');
                const currencySetting = settings.find(s => s.key === 'default_currency');
                
                setSystemSettings({
                    vatRate: vatRateSetting ? parseFloat(vatRateSetting.value) : 15,
                    currency: currencySetting ? currencySetting.value : 'SAR'
                });

                setConditionData(prev => ({
                    ...prev,
                    nationalities: (nationalities || []).map(n => ({ value: n.name, label: n.name })),
                    cities: (cities || []).map(c => ({ value: c.name, label: c.name })),
                    jobs: (jobsData || []).map(j => ({ value: j.id, label: j.job_title })),
                    jobProfiles: (jobProfilesData || []).map(jp => ({ value: jp.id, label: jp.job_title }))
                }));
            } catch (error) {
                console.error("Error loading dropdown data:", error);
            }
        }
        loadDropdownData();
    }, []);

    const handleChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            
            // Auto-adjust applicable_for based on scope
            if (field === 'scope') {
                if (value === 'overall_quote') {
                    // If scope is overall_quote, only check overall_quote and uncheck others
                    newData.applicable_for = ['overall_quote'];
                } else if (value === 'line_item') {
                    // If scope is line_item, check job_profile and nationality, uncheck overall_quote
                    newData.applicable_for = ['job_profile', 'nationality'];
                }
            }
            
            return newData;
        });
    };

    const handleReset = () => {
        setFormData(originalFormData);
    };

    const handleConditionChange = (conditions) => {
        setFormData(prev => ({ ...prev, conditions }));
    };

    const handleApplicableForChange = (value, checked) => {
        setFormData(prev => {
            const newApplicableFor = checked 
                ? [...(prev.applicable_for || []), value]
                : (prev.applicable_for || []).filter(item => item !== value);
            return { ...prev, applicable_for: newApplicableFor };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const dataToSend = { ...formData };
            if (dataToSend.from_date) dataToSend.from_date = new Date(dataToSend.from_date).toISOString();
            if (dataToSend.to_date) dataToSend.to_date = new Date(dataToSend.to_date).toISOString();

            if (component) {
                const updatedComponent = await CostComponent.update(component.id, dataToSend);
                await logAuditEvent({
                    action: 'update',
                    entityType: 'CostComponent',
                    entityId: component.id,
                    entityName: component.name,
                    oldValues: component,
                    newValues: updatedComponent
                });
            } else {
                const newComponent = await CostComponent.create(dataToSend);
                await logAuditEvent({
                    action: 'create',
                    entityType: 'CostComponent',
                    entityId: newComponent.id,
                    entityName: newComponent.name,
                    newValues: newComponent
                });
            }
            onSave();
        } catch (error) {
            console.error("Error saving cost component:", error);
            alert("Failed to save. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const calculatePreview = () => {
        const { baseCost, quantity } = previewData;
        let componentValue = parseFloat(formData.value) || 0;

        if (formData.calculation_method === 'percentage_of_base') {
            componentValue = (baseCost * (componentValue / 100));
        } else if (formData.calculation_method === 'per_unit_quantity') {
            componentValue = componentValue * quantity;
        }

        const totalValue = componentValue * quantity;
        const vatAmount = formData.vat_applicable ? totalValue * (systemSettings.vatRate / 100) : 0;
        const totalWithVat = totalValue + vatAmount;

        return {
            componentValue,
            totalValue,
            vatAmount,
            totalWithVat
        };
    };

    const previewCalculation = calculatePreview();

    return (
        <TooltipProvider>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8 p-2">
                {/* Left Column - Form Fields */}
                <div className="xl:col-span-2 space-y-8">
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="basic" className="text-base py-3">Basic Info</TabsTrigger>
                            <TabsTrigger value="advanced" className="text-base py-3">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5" />
                                    Smart Rules
                                </div>
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="text-base py-3">Settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-6 mt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Label htmlFor="name" className="flex items-center gap-2 text-base font-medium mb-3">
                                                Component Name *
                                                <Info className="w-4 h-4 text-gray-400" />
                                            </Label>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>A clear, descriptive name for this cost component (e.g., "Housing Allowance", "Transportation Fee")</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Input 
                                        id="name" 
                                        value={formData.name} 
                                        onChange={e => handleChange('name', e.target.value)} 
                                        required 
                                        className="h-12 text-base"
                                    />
                                </div>
                                <div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Label htmlFor="arabic_name" className="flex items-center gap-2 text-base font-medium mb-3">
                                                Arabic Name
                                                <Info className="w-4 h-4 text-gray-400" />
                                            </Label>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>The Arabic translation of the component name for bilingual reports</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Input 
                                        id="arabic_name" 
                                        value={formData.arabic_name} 
                                        onChange={e => handleChange('arabic_name', e.target.value)} 
                                        className="h-12 text-base"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Label htmlFor="code" className="flex items-center gap-2 text-base font-medium mb-3">
                                                Code *
                                                <Info className="w-4 h-4 text-gray-400" />
                                            </Label>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>A unique short code for this component (e.g., "HOUSE_ALL", "TRANS_FEE")</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Input 
                                        id="code" 
                                        value={formData.code} 
                                        onChange={e => handleChange('code', e.target.value.toUpperCase())} 
                                        required 
                                        className="h-12 text-base"
                                    />
                                </div>
                                <div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Label htmlFor="type" className="flex items-center gap-2 text-base font-medium mb-3">
                                                Type *
                                                <Info className="w-4 h-4 text-gray-400" />
                                            </Label>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>The category or nature of this cost component</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                                        <SelectTrigger id="type" className="h-12 text-base">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="base_cost">Base Cost</SelectItem>
                                            <SelectItem value="allowance">Allowance</SelectItem>
                                            <SelectItem value="one_time_fee">One-time Fee</SelectItem>
                                            <SelectItem value="recurring_fee">Recurring Fee</SelectItem>
                                            <SelectItem value="markup">Markup</SelectItem>
                                            <SelectItem value="discount">Discount</SelectItem>
                                            <SelectItem value="security_deposit">Security Deposit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Label htmlFor="calculation_method" className="flex items-center gap-2 text-base font-medium mb-3">
                                                Calculation Method *
                                                <Info className="w-4 h-4 text-gray-400" />
                                            </Label>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>How the final value is calculated: Fixed Amount, Percentage of Base Cost, or Per Unit Quantity</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Select value={formData.calculation_method} onValueChange={(value) => handleChange('calculation_method', value)}>
                                        <SelectTrigger id="calculation_method" className="h-12 text-base">
                                            <SelectValue placeholder="Method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                                            <SelectItem value="percentage_of_base">% of Base</SelectItem>
                                            <SelectItem value="per_unit_quantity">Per Unit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Label htmlFor="value" className="flex items-center gap-2 text-base font-medium mb-3">
                                                Value *
                                                <Info className="w-4 h-4 text-gray-400" />
                                            </Label>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>The base value (amount, percentage, or per-unit cost) depending on calculation method</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Input 
                                        id="value" 
                                        type="number" 
                                        step="0.01"
                                        value={formData.value} 
                                        onChange={e => handleChange('value', parseFloat(e.target.value) || 0)} 
                                        required 
                                        className="h-12 text-base"
                                    />
                                </div>
                                <div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Label htmlFor="periodicity" className="flex items-center gap-2 text-base font-medium mb-3">
                                                Frequency *
                                                <Info className="w-4 h-4 text-gray-400" />
                                            </Label>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>How often this cost is incurred (monthly, one-time, etc.)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Select value={formData.periodicity} onValueChange={(value) => handleChange('periodicity', value)}>
                                        <SelectTrigger id="periodicity" className="h-12 text-base">
                                            <SelectValue placeholder="Frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="one_time">One-time</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="annually">Annually</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Label htmlFor="scope" className="flex items-center gap-2 text-base font-medium mb-3">
                                                Scope *
                                                <Info className="w-4 h-4 text-gray-400" />
                                            </Label>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Whether this cost applies to each line item individually or the entire quote</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Select value={formData.scope} onValueChange={(value) => handleChange('scope', value)}>
                                        <SelectTrigger id="scope" className="h-12 text-base">
                                            <SelectValue placeholder="Select scope" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="line_item">Line Item</SelectItem>
                                            <SelectItem value="overall_quote">Overall Quote</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Label htmlFor="category" className="flex items-center gap-2 text-base font-medium mb-3">
                                                Category *
                                                <Info className="w-4 h-4 text-gray-400" />
                                            </Label>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>High-level category for reporting and grouping purposes</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                                        <SelectTrigger id="category" className="h-12 text-base">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="personnel_cost">Personnel Cost</SelectItem>
                                            <SelectItem value="administrative_fee">Administrative Fee</SelectItem>
                                            <SelectItem value="logistics">Logistics</SelectItem>
                                            <SelectItem value="financial">Financial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Label className="flex items-center gap-2 text-base font-medium mb-4">
                                            Applicable For *
                                            <Info className="w-4 h-4 text-gray-400" />
                                        </Label>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Where this component can be set as a default cost component (auto-adjusted based on scope)</p>
                                    </TooltipContent>
                                </Tooltip>
                                <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="job_profile"
                                            checked={(formData.applicable_for || []).includes('job_profile')}
                                            onCheckedChange={(checked) => handleApplicableForChange('job_profile', checked)}
                                            className="w-5 h-5"
                                        />
                                        <Label htmlFor="job_profile" className="text-base">Job Profile</Label>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="nationality"
                                            checked={(formData.applicable_for || []).includes('nationality')}
                                            onCheckedChange={(checked) => handleApplicableForChange('nationality', checked)}
                                            className="w-5 h-5"
                                        />
                                        <Label htmlFor="nationality" className="text-base">Nationality</Label>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="overall_quote"
                                            checked={(formData.applicable_for || []).includes('overall_quote')}
                                            onCheckedChange={(checked) => handleApplicableForChange('overall_quote', checked)}
                                            className="w-5 h-5"
                                        />
                                        <Label htmlFor="overall_quote" className="text-base">Overall Quote</Label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Label htmlFor="description" className="flex items-center gap-2 text-base font-medium mb-3">
                                            Description
                                            <Info className="w-4 h-4 text-gray-400" />
                                        </Label>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Detailed description of what this component covers (will appear in quotes)</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Textarea 
                                    id="description" 
                                    value={formData.description} 
                                    onChange={e => handleChange('description', e.target.value)} 
                                    rows={4}
                                    className="text-base"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="advanced" className="space-y-6 mt-6">
                            <SmartConditionsPanel 
                                conditions={formData.conditions}
                                onChange={handleConditionChange}
                                conditionData={conditionData}
                            />
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-6 mt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="integration_key" className="text-base font-medium mb-3 block">Integration Key</Label>
                                    <Input 
                                        id="integration_key" 
                                        value={formData.integration_key} 
                                        onChange={e => handleChange('integration_key', e.target.value)} 
                                        className="h-12 text-base"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="currency" className="text-base font-medium mb-3 block">Currency</Label>
                                    <Select value={formData.currency} onValueChange={(value) => handleChange('currency', value)}>
                                        <SelectTrigger id="currency" className="h-12 text-base">
                                            <SelectValue placeholder="Currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SAR">SAR</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="AED">AED</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="from_date" className="text-base font-medium mb-3 block">From Date</Label>
                                    <Input 
                                        id="from_date" 
                                        type="date" 
                                        value={formData.from_date} 
                                        onChange={e => handleChange('from_date', e.target.value)} 
                                        className="h-12 text-base"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="to_date" className="text-base font-medium mb-3 block">To Date</Label>
                                    <Input 
                                        id="to_date" 
                                        type="date" 
                                        value={formData.to_date} 
                                        onChange={e => handleChange('to_date', e.target.value)} 
                                        className="h-12 text-base"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-6 p-4 border rounded-lg bg-gray-50">
                                <div className="flex items-center space-x-3">
                                    <Switch 
                                        id="vat_applicable" 
                                        checked={formData.vat_applicable} 
                                        onCheckedChange={checked => handleChange('vat_applicable', checked)} 
                                        className="w-12 h-6"
                                    />
                                    <Label htmlFor="vat_applicable" className="text-base">VAT Applicable ({systemSettings.vatRate}%)</Label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Switch 
                                        id="is_active" 
                                        checked={formData.is_active} 
                                        onCheckedChange={checked => handleChange('is_active', checked)} 
                                        className="w-12 h-6"
                                    />
                                    <Label htmlFor="is_active" className="text-base">Component is Active</Label>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column - Live Preview */}
                <div className="xl:col-span-1">
                    <LivePreviewPanel 
                        formData={formData}
                        systemSettings={systemSettings}
                        previewData={previewData}
                        setPreviewData={setPreviewData}
                        previewCalculation={previewCalculation}
                    />
                </div>

                {/* Form Actions */}
                <div className="xl:col-span-3 flex justify-between items-center pt-6 border-t mt-8">
                    <Button type="button" variant="outline" onClick={handleReset} className="flex items-center gap-2 h-12 px-6 text-base">
                        <RefreshCw className="w-5 h-5" />
                        Reset to Default
                    </Button>
                    <div className="flex gap-4">
                        <Button type="button" variant="ghost" onClick={onCancel} className="h-12 px-6 text-base">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving} className="clay-button bg-emerald-500 text-white h-12 px-8 text-base">
                            {isSaving ? 'Saving...' : 'Save Cost Component'}
                        </Button>
                    </div>
                </div>
            </form>
        </TooltipProvider>
    );
}

// Smart Conditions Panel Component
function SmartConditionsPanel({ conditions, onChange, conditionData }) {
    const [localConditions, setLocalConditions] = useState(conditions || { all: [] });

    const addCondition = () => {
        const newConditions = {
            ...localConditions,
            all: [...localConditions.all, { fact: '', operator: 'equal', value: '' }]
        };
        setLocalConditions(newConditions);
        onChange(newConditions);
    };

    const removeCondition = (index) => {
        const newConditions = {
            ...localConditions,
            all: localConditions.all.filter((_, i) => i !== index)
        };
        setLocalConditions(newConditions);
        onChange(newConditions);
    };

    const updateCondition = (index, field, value) => {
        const newConditions = {
            ...localConditions,
            all: localConditions.all.map((condition, i) => 
                i === index ? { ...condition, [field]: value } : condition
            )
        };
        setLocalConditions(newConditions);
        onChange(newConditions);
    };

    const clearAllConditions = () => {
        const newConditions = { all: [] };
        setLocalConditions(newConditions);
        onChange(null);
    };

    return (
        <Card className="clay-card">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    Smart Component Conditions
                </CardTitle>
                <p className="text-sm text-gray-600">
                    Define conditions for this component to be automatically applied. Leave empty for always-available component.
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                {localConditions.all.map((condition, index) => (
                    <div key={index} className="p-4 clay-element rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Condition {index + 1}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCondition(index)}
                                className="h-8 w-8 text-red-500"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                            <Select 
                                value={condition.fact} 
                                onValueChange={(value) => updateCondition(index, 'fact', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                    {conditionFacts.map(fact => (
                                        <SelectItem key={fact.value} value={fact.value}>
                                            {fact.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select 
                                value={condition.operator} 
                                onValueChange={(value) => updateCondition(index, 'operator', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Operator" />
                                </SelectTrigger>
                                <SelectContent>
                                    {operators.map(op => (
                                        <SelectItem key={op.value} value={op.value}>
                                            {op.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <ConditionValueInput 
                                condition={condition}
                                conditionData={conditionData}
                                onChange={(value) => updateCondition(index, 'value', value)}
                            />
                        </div>
                    </div>
                ))}

                <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={addCondition}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Condition
                    </Button>
                    {localConditions.all.length > 0 && (
                        <Button type="button" variant="ghost" onClick={clearAllConditions}>
                            Clear All
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Condition Value Input Component
function ConditionValueInput({ condition, conditionData, onChange }) {
    const fact = conditionFacts.find(f => f.value === condition.fact);
    
    if (!fact) {
        return (
            <Input 
                placeholder="Enter value"
                value={condition.value}
                onChange={(e) => onChange(e.target.value)}
            />
        );
    }

    if (fact.type === 'number') {
        return (
            <Input 
                type="number"
                placeholder="Enter number"
                value={condition.value}
                onChange={(e) => onChange(e.target.value)}
            />
        );
    }

    if (fact.type === 'select' && fact.source && conditionData[fact.source]) {
        return (
            <Select value={condition.value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                    {conditionData[fact.source].map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    return (
        <Input 
            placeholder="Enter value"
            value={condition.value}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}

// Live Preview Panel Component
function LivePreviewPanel({ formData, systemSettings, previewData, setPreviewData, previewCalculation }) {
    return (
        <Card className="clay-card sticky top-4">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    Live Preview
                </CardTitle>
                <p className="text-sm text-gray-600">
                    See how this component affects costs in real-time
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-gray-50 border">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <Label className="text-xs font-medium text-gray-600">Base Cost ({systemSettings.currency})</Label>
                            <Input
                                type="number"
                                value={previewData.baseCost}
                                onChange={(e) => setPreviewData(prev => ({ 
                                    ...prev, 
                                    baseCost: parseFloat(e.target.value) || 0 
                                }))}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-medium text-gray-600">Quantity</Label>
                            <Input
                                type="number"
                                value={previewData.quantity}
                                onChange={(e) => setPreviewData(prev => ({ 
                                    ...prev, 
                                    quantity: parseInt(e.target.value) || 1 
                                }))}
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">{formData.name || "Component Name"}</h3>
                                <div className="flex items-center gap-2 text-xs">
                                    <Badge variant="secondary">{formData.type}</Badge>
                                    <Badge variant="outline">{formData.periodicity}</Badge>
                                    {formData.vat_applicable && (
                                        <Badge className="bg-orange-100 text-orange-800">VAT</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 min-h-[20px]">
                            {formData.description || "Component description will appear here..."}
                        </p>

                        <div className="border-t pt-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Component Value:</span>
                                <span className="font-medium">
                                    {formData.calculation_method === 'percentage_of_base' 
                                        ? `${formData.value}% of base`
                                        : `${previewCalculation.componentValue.toFixed(2)} ${systemSettings.currency}`
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Value ({previewData.quantity}x):</span>
                                <span className="font-medium">
                                    {previewCalculation.totalValue.toFixed(2)} ${systemSettings.currency}
                                </span>
                            </div>
                            {formData.vat_applicable && (
                                <div className="flex justify-between text-orange-600">
                                    <span>VAT ({systemSettings.vatRate}%):</span>
                                    <span className="font-medium">
                                        {previewCalculation.vatAmount.toFixed(2)} ${systemSettings.currency}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between font-semibold text-green-600 border-t pt-2">
                                <span>Total with VAT:</span>
                                <span>{previewCalculation.totalWithVat.toFixed(2)} ${systemSettings.currency}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {formData.conditions && formData.conditions.all && formData.conditions.all.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">Smart Component</span>
                        </div>
                        <p className="text-xs text-yellow-700">
                            This component will only be applied when {formData.conditions.all.length} condition(s) are met.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}