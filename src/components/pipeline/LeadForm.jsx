import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Hash, User, Building, Phone, DollarSign, Info, Activity, ClipboardList } from 'lucide-react';
import { User as UserEntity } from '@/api/entities';

const SectionTitle = ({ icon, title }) => (
    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 col-span-full border-b pb-2 mb-4">
        {icon}
        <span>{title}</span>
    </h3>
);

export default function LeadForm({ lead, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    industry: 'other',
    status: 'new',
    priority: 'medium',
    estimated_value: 0,
    next_follow_up: '',
    notes: '',
    assigned_to: '',
    source: 'other',
    lead_number: '',
    job_requirements: []
  });

  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function loadData() {
        const [userList, me] = await Promise.all([
            UserEntity.list(),
            UserEntity.me()
        ]);
        setUsers(userList || []);
        setCurrentUser(me);

        // Set initial form data
        setFormData({
            company_name: lead?.company_name || '',
            contact_person: lead?.contact_person || '',
            email: lead?.email || '',
            phone: lead?.phone || '',
            industry: lead?.industry || 'other',
            status: lead?.status || 'new',
            priority: lead?.priority || 'medium',
            estimated_value: lead?.estimated_value || 0,
            next_follow_up: lead?.next_follow_up || '',
            notes: lead?.notes || '',
            assigned_to: lead?.assigned_to || me?.id || '', // Default to current user
            source: lead?.source || 'other',
            lead_number: lead?.lead_number || '',
            job_requirements: lead?.job_requirements || [],
        });
    }
    loadData();
  }, [lead]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, next_follow_up: date ? format(date, "yyyy-MM-dd") : '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filter out empty/invalid fields before saving
    const dataToSave = { ...formData };
    if (!dataToSave.next_follow_up) delete dataToSave.next_follow_up;
    if (isNaN(parseFloat(dataToSave.estimated_value))) dataToSave.estimated_value = 0;
    
    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        
        <SectionTitle icon={<Building className="w-5 h-5 text-blue-600" />} title="Company & Contact Information" />
        
        <div>
          <Label htmlFor="company_name">Company Name *</Label>
          <Input id="company_name" value={formData.company_name} onChange={e => handleChange('company_name', e.target.value)} required />
        </div>
        
        <div>
          <Label htmlFor="contact_person">Contact Person *</Label>
          <Input id="contact_person" value={formData.contact_person} onChange={e => handleChange('contact_person', e.target.value)} required />
        </div>
        
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Select value={formData.industry} onValueChange={value => handleChange('industry', value)}>
            <SelectTrigger><SelectValue placeholder="Select Industry" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="construction">Construction</SelectItem>
              <SelectItem value="hospitality">Hospitality</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="logistics">Logistics</SelectItem>
              <SelectItem value="oil_gas">Oil & Gas</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} required />
        </div>
        
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
        </div>

        <SectionTitle icon={<Activity className="w-5 h-5 text-emerald-600" />} title="Lead Status & Value" />

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={value => handleChange('status', value)}>
            <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={value => handleChange('priority', value)}>
            <SelectTrigger><SelectValue placeholder="Select Priority" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="source">Source</Label>
          <Select value={formData.source} onValueChange={value => handleChange('source', value)}>
            <SelectTrigger><SelectValue placeholder="Select Source" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="cold_call">Cold Call</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Label htmlFor="estimated_value">Estimated Value</Label>
          <DollarSign className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
          <Input id="estimated_value" type="number" value={formData.estimated_value} onChange={e => handleChange('estimated_value', e.target.value)} className="pl-9" />
        </div>
        
        <div>
          <Label>Next Follow Up Date</Label>
          <Popover>
            <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.next_follow_up ? format(new Date(formData.next_follow_up), "PPP") : "Pick a date"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.next_follow_up ? new Date(formData.next_follow_up) : null} onSelect={handleDateChange} /></PopoverContent>
          </Popover>
        </div>
        
        <SectionTitle icon={<Info className="w-5 h-5 text-gray-600" />} title="Ownership & Details" />

        <div>
          <Label htmlFor="assigned_to">Assigned To</Label>
          <Select value={formData.assigned_to} onValueChange={value => handleChange('assigned_to', value)}>
            <SelectTrigger><SelectValue placeholder="Select User" /></SelectTrigger>
            <SelectContent>
                {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                        {user.full_name || `${user.first_name} ${user.last_name}`} ({user.email})
                    </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {lead?.lead_number && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border h-full">
          <Hash className="w-5 h-5 text-gray-600" />
          <div>
            <Label className="text-sm font-medium text-gray-800">Lead Number</Label>
            <p className="text-base font-mono font-bold text-gray-900">{lead.lead_number}</p>
          </div>
        </div>
        )}

        <div className="col-span-full">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} rows={4} />
        </div>
        
        {/* Placeholder for Job Requirements - To be implemented if needed */}
        <SectionTitle icon={<ClipboardList className="w-5 h-5 text-purple-600" />} title="Job Requirements" />
        <div className="col-span-full bg-gray-50 p-4 rounded-lg text-center text-gray-500">
            <p>Job requirements management will be added here in a future update.</p>
        </div>

      </div>

      <div className="flex justify-end gap-3 pt-6 border-t mt-6">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="clay-button bg-blue-600 text-white hover:bg-blue-700">Save Lead</Button>
      </div>
    </form>
  );
}