import React, { useState, useEffect } from 'react';
import { Nationality } from '@/api/entities';
import { CostComponent } from '@/api/entities';
import { SystemSetting } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, List, DollarSign, Flag, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CostComponentMultiSelect from '../common/CostComponentMultiSelect';
import { logAuditEvent } from '@/components/common/AuditService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function NationalityForm({ nationality, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    arabic_name: '',
    code: '',
    iso_code: '',
    description: '',
    default_cost_components: [],
    is_active: true,
    integration_key: '',
    from_date: '',
    to_date: ''
  });

  const [costComponents, setCostComponents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [systemSettings, setSystemSettings] = useState({ vatRate: 15, currency: 'SAR' });

  useEffect(() => {
    async function loadCostComponents() {
      try {
        const costComponentsData = await CostComponent.filter({ is_active: true, scope: 'line_item' });
        const applicableComponents = (costComponentsData || []).filter(c =>
          c.applicable_for && Array.isArray(c.applicable_for) && c.applicable_for.includes('nationality')
        );
        setCostComponents(applicableComponents);
      } catch (error) {
        console.error("Error loading cost components:", error);
        setCostComponents([]);
      }
    }
    loadCostComponents();
  }, []);

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
    if (nationality) {
      setFormData({
        name: nationality.name || '',
        arabic_name: nationality.arabic_name || '',
        code: nationality.code || '',
        iso_code: nationality.iso_code || '',
        description: nationality.description || '',
        default_cost_components: nationality.default_cost_components || [],
        is_active: nationality.is_active !== undefined ? nationality.is_active : true,
        integration_key: nationality.integration_key || '',
        from_date: nationality.from_date ? new Date(nationality.from_date).toISOString().split('T')[0] : '',
        to_date: nationality.to_date ? new Date(nationality.to_date).toISOString().split('T')[0] : ''
      });
    }
  }, [nationality]);

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

      if (nationality) {
        const updatedNationality = await Nationality.update(nationality.id, dataToSend);
        await logAuditEvent({
          action: 'update',
          entityType: 'Nationality',
          entityId: nationality.id,
          entityName: nationality.name,
          oldValues: nationality,
          newValues: updatedNationality
        });
      } else {
        const newNationality = await Nationality.create(dataToSend);
        await logAuditEvent({
          action: 'create',
          entityType: 'Nationality',
          entityId: newNationality.id,
          entityName: newNationality.name,
          newValues: newNationality
        });
      }
      onSave();
    } catch (error) {
      console.error("Error saving nationality:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCostComponents = costComponents.filter(c => formData.default_cost_components.includes(c.id));

  const calculateTotals = () => {
    let subtotal = 0;
    let totalVat = 0;

    selectedCostComponents.forEach(component => {
      if (component.calculation_method === 'fixed_amount') {
        const componentValue = parseFloat(component.value) || 0;
        subtotal += componentValue;
        if (component.vat_applicable) {
          totalVat += componentValue * (systemSettings.vatRate / 100);
        }
      }
    });

    return { subtotal, totalVat, grandTotal: subtotal + totalVat };
  };

  const totals = calculateTotals();

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="clay-card">
              <CardHeader><CardTitle>Identity Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nationality Name *</Label>
                      <Input id="name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="arabic_name">Arabic Name</Label>
                      <Input id="arabic_name" value={formData.arabic_name} onChange={e => handleChange('arabic_name', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">Code (e.g., PH) *</Label>
                      <Input id="code" value={formData.code} onChange={e => handleChange('code', e.target.value.toUpperCase())} required />
                    </div>
                    <div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Label htmlFor="iso_code" className="flex items-center gap-2">
                                    ISO Code <Info className="w-4 h-4 text-gray-400" />
                                </Label>
                            </TooltipTrigger>
                            <TooltipContent><p>Official 2-letter ISO 3166-1 country code for flag display (e.g., PH, IN, EG).</p></TooltipContent>
                        </Tooltip>
                      <Input id="iso_code" value={formData.iso_code} onChange={e => handleChange('iso_code', e.target.value.toUpperCase())} />
                    </div>
                  </div>
              </CardContent>
          </Card>

          <Card className="clay-card">
              <CardHeader><CardTitle>Pricing and Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="integration_key">Integration Key</Label>
                      <Input id="integration_key" value={formData.integration_key} onChange={e => handleChange('integration_key', e.target.value)} />
                    </div>
                     <div className="flex items-center space-x-2 pt-6">
                        <Switch id="is_active" checked={formData.is_active} onCheckedChange={c => handleChange('is_active', c)} />
                        <Label htmlFor="is_active">Nationality is Active</Label>
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
              </CardContent>
          </Card>
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
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    {formData.iso_code && formData.iso_code.length === 2 ? (
                      <img 
                        src={`https://flagcdn.com/w40/${formData.iso_code.toLowerCase()}.png`} 
                        alt={`${formData.name} flag`} 
                        className="object-contain rounded-sm"
                      />
                    ) : <Flag className="w-6 h-6 text-gray-500" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{formData.name || "Nationality"}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="secondary">Code: {formData.code || 'N/A'}</Badge>
                      {formData.iso_code && <Badge variant="outline">ISO: {formData.iso_code}</Badge>}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 min-h-[20px]">{formData.description || "Description will be shown here..."}</p>

                <div className="border-t pt-3 space-y-2 text-sm">
                  {selectedCostComponents.length > 0 ? (
                    <div className="pt-2">
                      <h4 className="text-gray-500 flex items-center gap-2 mb-1 font-semibold">
                        <List className="w-4 h-4" /> Default Costs
                      </h4>
                      <div className="pl-6 border-l ml-2 space-y-1">
                        {selectedCostComponents.map(comp => (
                          <div key={comp.id} className="flex justify-between items-center text-xs">
                              <span>{comp.name}</span>
                              <span className="font-medium">
                                {(parseFloat(comp.value) || 0).toLocaleString('en-US')} {systemSettings.currency}
                              </span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t mt-3 pt-2 space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span>Subtotal Default Costs</span>
                          <span className="font-medium">{totals.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {systemSettings.currency}</span>
                        </div>
                        {totals.totalVat > 0 && (
                          <div className="flex justify-between items-center text-sm text-orange-600">
                            <span>Total VAT</span>
                            <span className="font-medium">{totals.totalVat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {systemSettings.currency}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-sm font-semibold text-green-600 border-t pt-1">
                          <span>Grand Total Default Costs</span>
                          <span>{totals.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {systemSettings.currency}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-xs text-gray-500 py-4">No default costs assigned.</p>
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
            {isSaving ? 'Saving...' : 'Save Nationality'}
          </Button>
        </div>
      </form>
    </TooltipProvider>
  );
}