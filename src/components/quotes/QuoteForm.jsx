import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Save, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function QuoteForm({ quote, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    status: 'draft',
    valid_until: null,
    terms_conditions: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (quote) {
      setFormData({
        status: quote.status || 'draft',
        valid_until: quote.valid_until ? new Date(quote.valid_until) : null,
        terms_conditions: quote.terms_conditions || '',
      });
    }
  }, [quote]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const dataToSave = {
        ...formData,
        valid_until: formData.valid_until ? format(formData.valid_until, 'yyyy-MM-dd') : null,
    };
    try {
      await onSave(dataToSave);
    } catch (error) {
      console.error("Error saving quote:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!quote) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="valid_until">Valid Until</Label>
           <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.valid_until ? format(formData.valid_until, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={formData.valid_until} onSelect={(date) => handleChange('valid_until', date)} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="terms_conditions">Terms &amp; Conditions</Label>
          <Textarea 
            id="terms_conditions" 
            value={formData.terms_conditions} 
            onChange={(e) => handleChange('terms_conditions', e.target.value)}
            rows={5}
          />
        </div>
      </div>
       <div className="flex items-center p-4 border-t border-gray-200/50 mt-4 text-sm">
            <div className="flex-1">
                <p className="font-medium text-gray-800">{quote.client_company}</p>
                <p className="text-xs text-gray-500">{quote.quote_number}</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="font-bold text-lg text-emerald-600">${quote.total_amount?.toLocaleString() || '0.00'}</p>
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
            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
          )}
        </Button>
      </div>
    </form>
  );
}