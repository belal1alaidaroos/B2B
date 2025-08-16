import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Save, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Account } from '@/api/entities';

export default function JobForm({ job, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    job_title: '',
    account_id: '',
    status: 'pending',
    start_date: null,
    end_date: null,
    number_of_personnel: 1,
    site_location: '',
    notes: '',
  });
  const [accounts, setAccounts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      const accountsData = await Account.list();
      setAccounts(accountsData);
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (job) {
      setFormData({
        job_title: job.job_title || '',
        account_id: job.account_id || '',
        status: job.status || 'pending',
        start_date: job.start_date ? new Date(job.start_date) : null,
        end_date: job.end_date ? new Date(job.end_date) : null,
        number_of_personnel: job.number_of_personnel || 1,
        site_location: job.site_location || '',
        notes: job.notes || '',
      });
    } else {
        setFormData({
            job_title: '',
            account_id: '',
            status: 'pending',
            start_date: new Date(),
            end_date: null,
            number_of_personnel: 1,
            site_location: '',
            notes: '',
        });
    }
  }, [job]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.account_id) {
        alert("Please select a client account.");
        return;
    }
    setIsSaving(true);
    // Format dates to string before saving
    const dataToSave = {
        ...formData,
        start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
        end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
    };
    try {
      await onSave(dataToSave);
    } catch (error) {
      console.error("Error saving job:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="job_title">Job Title *</Label>
          <Input id="job_title" value={formData.job_title} onChange={(e) => handleChange('job_title', e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="account_id">Client Account *</Label>
          <Select value={formData.account_id} onValueChange={(value) => handleChange('account_id', value)}>
            <SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger>
            <SelectContent>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.company_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="start_date">Start Date</Label>
           <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.start_date ? format(formData.start_date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={formData.start_date} onSelect={(date) => handleChange('start_date', date)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1">
          <Label htmlFor="end_date">End Date</Label>
           <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.end_date ? format(formData.end_date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={formData.end_date} onSelect={(date) => handleChange('end_date', date)} />
            </PopoverContent>
          </Popover>
        </div>
         <div className="space-y-1">
          <Label htmlFor="number_of_personnel">Number of Personnel</Label>
          <Input id="number_of_personnel" type="number" value={formData.number_of_personnel} onChange={(e) => handleChange('number_of_personnel', parseInt(e.target.value) || 1)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="site_location">Site Location</Label>
          <Input id="site_location" value={formData.site_location} onChange={(e) => handleChange('site_location', e.target.value)} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          <XCircle className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving} className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          {isSaving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Job</>
          )}
        </Button>
      </div>
    </form>
  );
}