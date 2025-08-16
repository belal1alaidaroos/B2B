import React, { useState } from 'react';
import { Contract } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ContractForm({ contract, accounts, onSuccess, onCancel }) {
  const [formData, setFormData] = useState(contract || {
    contract_number: `CON-${Date.now()}`,
    title: '',
    account_id: '',
    status: 'draft',
    start_date: '',
    end_date: '',
    total_value: '',
    payment_terms: 'net_30',
    description: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const dataToSave = { ...formData, total_value: parseFloat(formData.total_value) };
      if (contract?.id) {
        await Contract.update(contract.id, dataToSave);
      } else {
        await Contract.create(dataToSave);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save contract:", error);
      alert('Failed to save contract.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contract_number">Contract Number</Label>
          <Input id="contract_number" value={formData.contract_number} onChange={(e) => handleChange('contract_number', e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} required />
        </div>
      </div>
      <div>
        <Label htmlFor="account_id">Account</Label>
        <Select value={formData.account_id} onValueChange={(v) => handleChange('account_id', v)} required>
          <SelectTrigger id="account_id"><SelectValue placeholder="Select an account" /></SelectTrigger>
          <SelectContent>{accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.company_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(v) => handleChange('status', v)} required>
            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
              <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
            </SelectContent>
          </Select>
        </div>
         <div>
          <Label htmlFor="payment_terms">Payment Terms</Label>
          <Select value={formData.payment_terms} onValueChange={(v) => handleChange('payment_terms', v)} required>
            <SelectTrigger id="payment_terms"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="net_15">Net 15</SelectItem>
              <SelectItem value="net_30">Net 30</SelectItem>
              <SelectItem value="net_45">Net 45</SelectItem>
              <SelectItem value="advance_payment">Advance Payment</SelectItem>
              <SelectItem value="monthly_billing">Monthly Billing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input id="start_date" type="date" value={formData.start_date} onChange={(e) => handleChange('start_date', e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="end_date">End Date</Label>
          <Input id="end_date" type="date" value={formData.end_date} onChange={(e) => handleChange('end_date', e.target.value)} required />
        </div>
      </div>
      <div>
        <Label htmlFor="total_value">Total Value (AED)</Label>
        <Input id="total_value" type="number" value={formData.total_value} onChange={(e) => handleChange('total_value', e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Summary of contract terms..." />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
        <Button type="submit" disabled={isSaving} className="bg-emerald-600 text-white">{isSaving ? 'Saving...' : 'Save Contract'}</Button>
      </div>
    </form>
  );
}