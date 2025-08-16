import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, User, Briefcase, Phone, Mail, MessageSquare, Star, Clock, Tag } from 'lucide-react';

const SectionTitle = ({ icon, title }) => (
    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 col-span-full border-b pb-2 mb-4">
        {icon}
        <span>{title}</span>
    </h3>
);


export default function ContactForm({ contact, accounts, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    account_id: '',
    first_name: '',
    last_name: '',
    job_title: '',
    department: 'other',
    email: '',
    secondary_email: '',
    phone: '',
    mobile: '',
    direct_line: '',
    whatsapp: '',
    contact_preference: 'email',
    decision_maker: false,
    influencer: false,
    authority_level: 'medium',
    best_time_to_call: '',
    timezone: '',
    birthday: '',
    linkedin_profile: '',
    status: 'active',
    language: 'english',
    notes: '',
    tags: '',
    last_contact_date: '',
    next_contact_date: '',
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        account_id: contact.account_id || '',
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        job_title: contact.job_title || '',
        department: contact.department || 'other',
        email: contact.email || '',
        secondary_email: contact.secondary_email || '',
        phone: contact.phone || '',
        mobile: contact.mobile || '',
        direct_line: contact.direct_line || '',
        whatsapp: contact.whatsapp || '',
        contact_preference: contact.contact_preference || 'email',
        decision_maker: contact.decision_maker || false,
        influencer: contact.influencer || false,
        authority_level: contact.authority_level || 'medium',
        best_time_to_call: contact.best_time_to_call || '',
        timezone: contact.timezone || '',
        birthday: contact.birthday || '',
        linkedin_profile: contact.linkedin_profile || '',
        status: contact.status || 'active',
        language: contact.language || 'english',
        notes: contact.notes || '',
        tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : '',
        last_contact_date: contact.last_contact_date || '',
        next_contact_date: contact.next_contact_date || '',
      });
    }
  }, [contact]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field, date) => {
    setFormData(prev => ({ ...prev, [field]: date ? format(date, "yyyy-MM-dd") : '' }));
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
        
        <SectionTitle icon={<User className="w-5 h-5 text-blue-600" />} title="Personal & Account Information" />

        <div>
            <Label htmlFor="account_id">Account *</Label>
            <Select value={formData.account_id} onValueChange={v => handleChange('account_id', v)} required>
                <SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger>
                <SelectContent>
                    {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.company_name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input id="first_name" value={formData.first_name} onChange={e => handleChange('first_name', e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name *</Label>
          <Input id="last_name" value={formData.last_name} onChange={e => handleChange('last_name', e.target.value)} required />
        </div>

        <SectionTitle icon={<Briefcase className="w-5 h-5 text-emerald-600" />} title="Professional Details" />

        <div>
          <Label htmlFor="job_title">Job Title</Label>
          <Input id="job_title" value={formData.job_title} onChange={e => handleChange('job_title', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Select value={formData.department} onValueChange={v => handleChange('department', v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="procurement">Procurement</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="authority_level">Authority Level</Label>
          <Select value={formData.authority_level} onValueChange={v => handleChange('authority_level', v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
                <SelectItem value="executive">Executive</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
            <Switch id="decision_maker" checked={formData.decision_maker} onCheckedChange={v => handleChange('decision_maker', v)} />
            <Label htmlFor="decision_maker">Decision Maker</Label>
        </div>
        <div className="flex items-center space-x-2">
            <Switch id="influencer" checked={formData.influencer} onCheckedChange={v => handleChange('influencer', v)} />
            <Label htmlFor="influencer">Influencer</Label>
        </div>


        <SectionTitle icon={<Phone className="w-5 h-5 text-orange-600" />} title="Contact Methods" />
        
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="secondary_email">Secondary Email</Label>
          <Input id="secondary_email" type="email" value={formData.secondary_email} onChange={e => handleChange('secondary_email', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="mobile">Mobile</Label>
          <Input id="mobile" value={formData.mobile} onChange={e => handleChange('mobile', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="direct_line">Direct Line</Label>
          <Input id="direct_line" value={formData.direct_line} onChange={e => handleChange('direct_line', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" value={formData.whatsapp} onChange={e => handleChange('whatsapp', e.target.value)} />
        </div>

        <SectionTitle icon={<MessageSquare className="w-5 h-5 text-purple-600" />} title="Preferences & Status" />

        <div>
          <Label htmlFor="contact_preference">Preferred Contact Method</Label>
          <Select value={formData.contact_preference} onValueChange={v => handleChange('contact_preference', v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="language">Preferred Language</Label>
          <Select value={formData.language} onValueChange={v => handleChange('language', v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="arabic">Arabic</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="urdu">Urdu</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={v => handleChange('status', v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="do_not_contact">Do Not Contact</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <SectionTitle icon={<Clock className="w-5 h-5 text-gray-600" />} title="Scheduling & Notes" />
        
        <div>
            <Label>Last Contact Date</Label>
            <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{formData.last_contact_date ? format(new Date(formData.last_contact_date), "PPP") : "Pick a date"}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.last_contact_date ? new Date(formData.last_contact_date) : null} onSelect={d => handleDateChange('last_contact_date', d)} /></PopoverContent>
            </Popover>
        </div>
        <div>
            <Label>Next Contact Date</Label>
            <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{formData.next_contact_date ? format(new Date(formData.next_contact_date), "PPP") : "Pick a date"}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.next_contact_date ? new Date(formData.next_contact_date) : null} onSelect={d => handleDateChange('next_contact_date', d)} /></PopoverContent>
            </Popover>
        </div>
         <div>
            <Label>Birthday</Label>
            <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{formData.birthday ? format(new Date(formData.birthday), "PPP") : "Pick a date"}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.birthday ? new Date(formData.birthday) : null} onSelect={d => handleDateChange('birthday', d)} /></PopoverContent>
            </Popover>
        </div>
        <div className="lg:col-span-full">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} rows={4} />
        </div>
        <div className="lg:col-span-full">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={formData.tags} onChange={e => handleChange('tags', e.target.value)} />
        </div>

       </div>

      <div className="flex justify-end gap-3 pt-8 border-t">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Contact</Button>
      </div>
    </form>
  );
}