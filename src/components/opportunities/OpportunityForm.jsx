import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Hash, Target, User, Building, DollarSign, Percent, Info, Briefcase } from 'lucide-react';
import { Account } from '@/api/entities';
import { Contact } from '@/api/entities';
import { User as UserEntity } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const SectionTitle = ({ icon, title }) => (
    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 col-span-full border-b pb-2 mb-4">
        {icon}
        <span>{title}</span>
    </h3>
);

export default function OpportunityForm({ opportunity, lead, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    account_id: '',
    primary_contact_id: '',
    stage: 'qualification',
    amount: 0,
    probability: 0,
    expected_close_date: '',
    owner_id: '',
    lost_reason: '',
    description: '',
    opportunity_number: '',
    lead_id: ''
  });

  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function loadData() {
        const [accountList, contactList, userList, me] = await Promise.all([
            Account.list(),
            Contact.list(),
            UserEntity.list(),
            UserEntity.me()
        ]);
        setAccounts(accountList || []);
        setContacts(contactList || []);
        setUsers(userList || []);
        setCurrentUser(me);

        let initialData = {
            name: opportunity?.name || (lead ? `${lead.company_name} Deal` : ''),
            account_id: opportunity?.account_id || '',
            primary_contact_id: opportunity?.primary_contact_id || '',
            stage: opportunity?.stage || 'qualification',
            amount: opportunity?.amount || lead?.estimated_value || 0,
            probability: opportunity?.probability || 10,
            expected_close_date: opportunity?.expected_close_date || '',
            owner_id: opportunity?.owner_id || me?.id || '',
            lost_reason: opportunity?.lost_reason || '',
            description: opportunity?.description || lead?.notes || '',
            opportunity_number: opportunity?.opportunity_number || '',
            lead_id: opportunity?.lead_id || lead?.id || ''
        };
        
        // If converting from lead, try to find matching account
        if (lead && !opportunity) {
            const matchingAccount = accountList.find(acc => acc.company_name.toLowerCase() === lead.company_name.toLowerCase());
            if (matchingAccount) {
                initialData.account_id = matchingAccount.id;
            }
        }
        
        setFormData(initialData);
    }
    loadData();
  }, [opportunity, lead]);

  useEffect(() => {
    if (formData.account_id) {
        setFilteredContacts(contacts.filter(c => c.account_id === formData.account_id));
    } else {
        setFilteredContacts([]);
    }
  }, [formData.account_id, contacts]);


  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, expected_close_date: date ? format(date, "yyyy-MM-dd") : '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    if (!dataToSave.expected_close_date) delete dataToSave.expected_close_date;
    if (isNaN(parseFloat(dataToSave.amount))) dataToSave.amount = 0;
    if (isNaN(parseFloat(dataToSave.probability))) dataToSave.probability = 0;
    
    onSave(dataToSave);
  };
  
  const selectedAccount = accounts.find(a => a.id === formData.account_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">

        <SectionTitle icon={<Target className="w-5 h-5 text-blue-600" />} title="Opportunity Details" />
        
        <div className="lg:col-span-2">
          <Label htmlFor="name">Opportunity Name *</Label>
          <Input id="name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="stage">Stage</Label>
          <Select value={formData.stage} onValueChange={value => handleChange('stage', value)}>
            <SelectTrigger><SelectValue placeholder="Select Stage" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="qualification">Qualification</SelectItem>
                <SelectItem value="needs_analysis">Needs Analysis</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="closed_won">Closed Won</SelectItem>
                <SelectItem value="closed_lost">Closed Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Label htmlFor="amount">Amount</Label>
          <DollarSign className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
          <Input id="amount" type="number" value={formData.amount} onChange={e => handleChange('amount', e.target.value)} className="pl-9" />
        </div>

        <div className="relative">
          <Label htmlFor="probability">Probability (%)</Label>
           <Percent className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
          <Input id="probability" type="number" min="0" max="100" value={formData.probability} onChange={e => handleChange('probability', e.target.value)} className="pl-9" />
        </div>

        <div>
          <Label>Expected Close Date</Label>
          <Popover>
            <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expected_close_date ? format(new Date(formData.expected_close_date), "PPP") : "Pick a date"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.expected_close_date ? new Date(formData.expected_close_date) : null} onSelect={handleDateChange} /></PopoverContent>
          </Popover>
        </div>
        
        <SectionTitle icon={<Building className="w-5 h-5 text-emerald-600" />} title="Account & Contact" />

        <div>
          <Label htmlFor="account_id">Account *</Label>
          <Select value={formData.account_id} onValueChange={value => handleChange('account_id', value)} required>
            <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
            <SelectContent>
                {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>{account.company_name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          {selectedAccount && <p className="text-xs text-gray-500 mt-1">Industry: {selectedAccount.industry}</p>}
        </div>

        <div>
          <Label htmlFor="primary_contact_id">Primary Contact</Label>
          <Select value={formData.primary_contact_id} onValueChange={value => handleChange('primary_contact_id', value)} disabled={!formData.account_id}>
            <SelectTrigger><SelectValue placeholder={formData.account_id ? "Select Contact" : "Select an account first"} /></SelectTrigger>
            <SelectContent>
                {filteredContacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name} ({contact.job_title})
                    </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <SectionTitle icon={<Info className="w-5 h-5 text-gray-600" />} title="Ownership & Details" />

        <div>
          <Label htmlFor="owner_id">Opportunity Owner</Label>
          <Select value={formData.owner_id} onValueChange={value => handleChange('owner_id', value)}>
            <SelectTrigger><SelectValue placeholder="Select Owner" /></SelectTrigger>
            <SelectContent>
                {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                        {user.full_name || `${user.first_name} ${user.last_name}`}
                    </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        
        {opportunity?.opportunity_number && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border h-full">
          <Hash className="w-5 h-5 text-gray-600" />
          <div>
            <Label className="text-sm font-medium text-gray-800">Opportunity Number</Label>
            <p className="text-base font-mono font-bold text-gray-900">{opportunity.opportunity_number}</p>
          </div>
        </div>
        )}

        {formData.lead_id && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200 h-full">
                <Briefcase className="w-5 h-5 text-green-600" />
                <div>
                    <Label className="text-sm font-medium text-green-800">Converted From Lead</Label>
                    <Link to={createPageUrl(`LeadsPipeline?highlight=${formData.lead_id}`)} className="text-sm font-semibold text-green-900 hover:underline">
                        View Original Lead
                    </Link>
                </div>
            </div>
        )}

        <div className="col-span-full">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={e => handleChange('description', e.target.value)} rows={4} />
        </div>

        {formData.stage === 'closed_lost' && (
             <div className="col-span-full">
                <Label htmlFor="lost_reason">Reason for Loss</Label>
                <Textarea id="lost_reason" value={formData.lost_reason} onChange={e => handleChange('lost_reason', e.target.value)} rows={2} />
            </div>
        )}

      </div>

      <div className="flex justify-end gap-3 pt-6 border-t mt-6">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="clay-button bg-blue-600 text-white hover:bg-blue-700">Save Opportunity</Button>
      </div>
    </form>
  );
}