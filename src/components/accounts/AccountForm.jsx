import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, DollarSign, Users, Link, MapPin, Tag, Info } from 'lucide-react';

const SectionTitle = ({ icon, title }) => (
    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 col-span-full border-b pb-2 mb-4">
        {icon}
        <span>{title}</span>
    </h3>
);

export default function AccountForm({ account, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    company_name: '',
    trading_name: '',
    industry: 'other',
    company_size: 'medium',
    registration_number: '',
    tax_number: '',
    website: '',
    primary_phone: '',
    primary_email: '',
    account_status: 'prospect',
    credit_limit: 0,
    payment_terms: 'net_30',
    preferred_currency: 'AED',
    annual_revenue: 0,
    employee_count: 0,
    notes: '',
    tags: '', // Storing tags as comma-separated string for simplicity in form
    billing_address: { street: '', city: '', state: '', postal_code: '', country: '' },
    physical_address: { street: '', city: '', state: '', postal_code: '', country: '' },
    social_links: { linkedin: '', facebook: '', twitter: '' }
  });

  useEffect(() => {
    if (account) {
      setFormData({
        company_name: account.company_name || '',
        trading_name: account.trading_name || '',
        industry: account.industry || 'other',
        company_size: account.company_size || 'medium',
        registration_number: account.registration_number || '',
        tax_number: account.tax_number || '',
        website: account.website || '',
        primary_phone: account.primary_phone || '',
        primary_email: account.primary_email || '',
        account_status: account.account_status || 'prospect',
        credit_limit: account.credit_limit || 0,
        payment_terms: account.payment_terms || 'net_30',
        preferred_currency: account.preferred_currency || 'AED',
        annual_revenue: account.annual_revenue || 0,
        employee_count: account.employee_count || 0,
        notes: account.notes || '',
        tags: Array.isArray(account.tags) ? account.tags.join(', ') : '',
        billing_address: account.billing_address || { street: '', city: '', state: '', postal_code: '', country: '' },
        physical_address: account.physical_address || { street: '', city: '', state: '', postal_code: '', country: '' },
        social_links: account.social_links || { linkedin: '', facebook: '', twitter: '' }
      });
    }
  }, [account]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (type, field, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const handleSocialChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [field]: value }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };
    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-1">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-4">
        
        <SectionTitle icon={<Building className="w-5 h-5 text-blue-600" />} title="Company Information" />
        
        <div>
          <Label htmlFor="company_name">Company Name *</Label>
          <Input id="company_name" value={formData.company_name} onChange={e => handleChange('company_name', e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="trading_name">Trading Name</Label>
          <Input id="trading_name" value={formData.trading_name} onChange={e => handleChange('trading_name', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="industry">Industry *</Label>
          <Select value={formData.industry} onValueChange={v => handleChange('industry', v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="hospitality">Hospitality</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="logistics">Logistics</SelectItem>
                <SelectItem value="oil_gas">Oil & Gas</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="primary_email">Primary Email</Label>
          <Input id="primary_email" type="email" value={formData.primary_email} onChange={e => handleChange('primary_email', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="primary_phone">Primary Phone</Label>
          <Input id="primary_phone" value={formData.primary_phone} onChange={e => handleChange('primary_phone', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input id="website" value={formData.website} onChange={e => handleChange('website', e.target.value)} placeholder="https://..." />
        </div>

        <SectionTitle icon={<Users className="w-5 h-5 text-emerald-600" />} title="Company Size & Status" />

        <div>
          <Label htmlFor="company_size">Company Size</Label>
          <Select value={formData.company_size} onValueChange={v => handleChange('company_size', v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
                <SelectItem value="startup">Startup (1-10)</SelectItem>
                <SelectItem value="small">Small (11-50)</SelectItem>
                <SelectItem value="medium">Medium (51-200)</SelectItem>
                <SelectItem value="large">Large (201-1000)</SelectItem>
                <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="employee_count">Employee Count</Label>
          <Input id="employee_count" type="number" value={formData.employee_count} onChange={e => handleChange('employee_count', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="account_status">Account Status</Label>
          <Select value={formData.account_status} onValueChange={v => handleChange('account_status', v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blacklisted">Blacklisted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <SectionTitle icon={<DollarSign className="w-5 h-5 text-orange-600" />} title="Financial Details" />

        <div>
          <Label htmlFor="annual_revenue">Annual Revenue</Label>
          <Input id="annual_revenue" type="number" value={formData.annual_revenue} onChange={e => handleChange('annual_revenue', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="credit_limit">Credit Limit</Label>
          <Input id="credit_limit" type="number" value={formData.credit_limit} onChange={e => handleChange('credit_limit', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="payment_terms">Payment Terms</Label>
          <Select value={formData.payment_terms} onValueChange={v => handleChange('payment_terms', v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
                <SelectItem value="net_15">Net 15</SelectItem>
                <SelectItem value="net_30">Net 30</SelectItem>
                <SelectItem value="net_45">Net 45</SelectItem>
                <SelectItem value="net_60">Net 60</SelectItem>
                <SelectItem value="advance_payment">Advance Payment</SelectItem>
                <SelectItem value="cod">Cash on Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="preferred_currency">Preferred Currency</Label>
          <Select value={formData.preferred_currency} onValueChange={v => handleChange('preferred_currency', v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
                <SelectItem value="AED">AED</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="SAR">SAR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="registration_number">Registration Number</Label>
          <Input id="registration_number" value={formData.registration_number} onChange={e => handleChange('registration_number', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="tax_number">Tax Number</Label>
          <Input id="tax_number" value={formData.tax_number} onChange={e => handleChange('tax_number', e.target.value)} />
        </div>

        <SectionTitle icon={<MapPin className="w-5 h-5 text-purple-600" />} title="Addresses" />
        
        <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Billing Address</h4>
                <Input placeholder="Street" value={formData.billing_address.street} onChange={e => handleAddressChange('billing_address', 'street', e.target.value)} />
                <Input placeholder="City" value={formData.billing_address.city} onChange={e => handleAddressChange('billing_address', 'city', e.target.value)} />
                <Input placeholder="State/Region" value={formData.billing_address.state} onChange={e => handleAddressChange('billing_address', 'state', e.target.value)} />
                <Input placeholder="Postal Code" value={formData.billing_address.postal_code} onChange={e => handleAddressChange('billing_address', 'postal_code', e.target.value)} />
                <Input placeholder="Country" value={formData.billing_address.country} onChange={e => handleAddressChange('billing_address', 'country', e.target.value)} />
            </div>
            <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Physical Address</h4>
                <Input placeholder="Street" value={formData.physical_address.street} onChange={e => handleAddressChange('physical_address', 'street', e.target.value)} />
                <Input placeholder="City" value={formData.physical_address.city} onChange={e => handleAddressChange('physical_address', 'city', e.target.value)} />
                <Input placeholder="State/Region" value={formData.physical_address.state} onChange={e => handleAddressChange('physical_address', 'state', e.target.value)} />
                <Input placeholder="Postal Code" value={formData.physical_address.postal_code} onChange={e => handleAddressChange('physical_address', 'postal_code', e.target.value)} />
                <Input placeholder="Country" value={formData.physical_address.country} onChange={e => handleAddressChange('physical_address', 'country', e.target.value)} />
            </div>
        </div>

        <SectionTitle icon={<Link className="w-5 h-5 text-indigo-600" />} title="Social & Other" />

        <div>
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input id="linkedin" value={formData.social_links.linkedin} onChange={e => handleSocialChange('linkedin', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="facebook">Facebook</Label>
          <Input id="facebook" value={formData.social_links.facebook} onChange={e => handleSocialChange('facebook', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="twitter">Twitter</Label>
          <Input id="twitter" value={formData.social_links.twitter} onChange={e => handleSocialChange('twitter', e.target.value)} />
        </div>
        <div className="lg:col-span-full">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={formData.tags} onChange={e => handleChange('tags', e.target.value)} />
        </div>
        <div className="lg:col-span-full">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} rows={4} />
        </div>

      </div>
      <div className="flex justify-end gap-3 pt-8 border-t">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Account</Button>
      </div>
    </form>
  );
}