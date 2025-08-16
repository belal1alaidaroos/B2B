import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { format } from 'date-fns';
import { CalendarIcon, Hash, User, Clock, Target, Flag, FileText, Users, Building, DollarSign } from 'lucide-react';
import { User as UserEntity } from '@/api/entities';

const SectionTitle = ({ icon, title }) => (
    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 col-span-full border-b pb-2 mb-4">
        {icon}
        <span>{title}</span>
    </h3>
);

export default function TaskForm({ task, onSave, onCancel, users, leads, opportunities, accounts }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'follow_up',
    status: 'pending',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    start_date: '',
    estimated_duration: 60,
    related_entity_type: '',
    related_entity_id: '',
    location: '',
    tags: [],
    notes: '',
    progress_percentage: 0,
    recurrence_pattern: 'none'
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    async function loadData() {
      const me = await UserEntity.me();
      setCurrentUser(me);

      const initialData = {
        title: task?.title || '',
        description: task?.description || '',
        task_type: task?.task_type || 'follow_up',
        status: task?.status || 'pending',
        priority: task?.priority || 'medium',
        assigned_to: task?.assigned_to || me?.id || '',
        due_date: task?.due_date ? task.due_date.split('T')[0] : '',
        start_date: task?.start_date ? task.start_date.split('T')[0] : '',
        estimated_duration: task?.estimated_duration || 60,
        related_entity_type: task?.related_entity_type || '',
        related_entity_id: task?.related_entity_id || '',
        location: task?.location || '',
        tags: task?.tags || [],
        notes: task?.notes || '',
        progress_percentage: task?.progress_percentage || 0,
        recurrence_pattern: task?.recurrence_pattern || 'none'
      };
      setFormData(initialData);
    }
    loadData();
  }, [task]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    
    // Convert dates to ISO format
    if (dataToSave.due_date) {
      dataToSave.due_date = new Date(dataToSave.due_date + 'T23:59:59').toISOString();
    }
    if (dataToSave.start_date) {
      dataToSave.start_date = new Date(dataToSave.start_date + 'T09:00:00').toISOString();
    }
    
    onSave(dataToSave);
  };

  const getRelatedEntityOptions = () => {
    switch (formData.related_entity_type) {
      case 'lead':
        return leads.map(lead => ({ id: lead.id, name: lead.company_name }));
      case 'opportunity':
        return opportunities.map(opp => ({ id: opp.id, name: opp.name }));
      case 'account':
        return accounts.map(acc => ({ id: acc.id, name: acc.company_name }));
      case 'user':
        return users.map(user => ({ id: user.id, name: user.full_name || `${user.first_name} ${user.last_name}` }));
      default:
        return [];
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        
        <SectionTitle icon={<Target className="w-5 h-5 text-blue-600" />} title="Task Information" />
        
        <div className="lg:col-span-2">
          <Label htmlFor="title">Task Title *</Label>
          <Input 
            id="title" 
            value={formData.title} 
            onChange={e => handleChange('title', e.target.value)} 
            required 
            placeholder="e.g., Follow up with ABC Company..."
          />
        </div>

        <div>
          <Label htmlFor="task_type">Task Type</Label>
          <Select value={formData.task_type} onValueChange={value => handleChange('task_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Phone Call</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="follow_up">Follow Up</SelectItem>
              <SelectItem value="demo">Product Demo</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="contract_review">Contract Review</SelectItem>
              <SelectItem value="document_prep">Document Preparation</SelectItem>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="admin">Administrative</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-3">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            value={formData.description} 
            onChange={e => handleChange('description', e.target.value)} 
            rows={3}
            placeholder="Detailed description of what needs to be done..."
          />
        </div>

        <SectionTitle icon={<Flag className="w-5 h-5 text-green-600" />} title="Status & Priority" />

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={value => handleChange('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={value => handleChange('priority', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Progress: {formData.progress_percentage}%</Label>
          <Slider
            value={[formData.progress_percentage]}
            onValueChange={([value]) => handleChange('progress_percentage', value)}
            max={100}
            step={5}
            className="mt-2"
          />
        </div>

        <SectionTitle icon={<User className="w-5 h-5 text-purple-600" />} title="Assignment & Timing" />

        <div>
          <Label htmlFor="assigned_to">Assigned To *</Label>
          <Select value={formData.assigned_to} onValueChange={value => handleChange('assigned_to', value)} required>
            <SelectTrigger>
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || `${user.first_name} ${user.last_name}`} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="due_date">Due Date *</Label>
          <Input 
            id="due_date" 
            type="date" 
            value={formData.due_date} 
            onChange={e => handleChange('due_date', e.target.value)} 
            required 
          />
        </div>

        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input 
            id="start_date" 
            type="date" 
            value={formData.start_date} 
            onChange={e => handleChange('start_date', e.target.value)} 
          />
        </div>

        <div>
          <Label htmlFor="estimated_duration">Estimated Duration (minutes)</Label>
          <Input 
            id="estimated_duration" 
            type="number" 
            value={formData.estimated_duration} 
            onChange={e => handleChange('estimated_duration', parseInt(e.target.value) || 60)} 
            min="15"
            step="15"
          />
        </div>

        <div>
          <Label htmlFor="recurrence">Recurrence</Label>
          <Select value={formData.recurrence_pattern} onValueChange={value => handleChange('recurrence_pattern', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <SectionTitle icon={<Building className="w-5 h-5 text-orange-600" />} title="Related Entity & Location" />

        <div>
          <Label htmlFor="related_entity_type">Related To</Label>
          <Select value={formData.related_entity_type} onValueChange={value => {
            handleChange('related_entity_type', value);
            handleChange('related_entity_id', ''); // Reset related entity ID when type changes
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>None</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="opportunity">Opportunity</SelectItem>
              <SelectItem value="account">Account</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.related_entity_type && (
          <div>
            <Label htmlFor="related_entity_id">Select {formData.related_entity_type}</Label>
            <Select value={formData.related_entity_id} onValueChange={value => handleChange('related_entity_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${formData.related_entity_type}`} />
              </SelectTrigger>
              <SelectContent>
                {getRelatedEntityOptions().map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="location">Location</Label>
          <Input 
            id="location" 
            value={formData.location} 
            onChange={e => handleChange('location', e.target.value)} 
            placeholder="e.g., Client office, Conference room A..."
          />
        </div>

        <SectionTitle icon={<FileText className="w-5 h-5 text-gray-600" />} title="Additional Details" />

        <div className="lg:col-span-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                {tag} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input 
              value={tagInput} 
              onChange={e => setTagInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add a tag..."
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>Add</Button>
          </div>
        </div>

        {task?.task_number && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
            <Hash className="w-5 h-5 text-gray-600" />
            <div>
              <Label className="text-sm font-medium text-gray-800">Task Number</Label>
              <p className="text-base font-mono font-bold text-gray-900">{task.task_number}</p>
            </div>
          </div>
        )}

        <div className="lg:col-span-3">
          <Label htmlFor="notes">Notes</Label>
          <Textarea 
            id="notes" 
            value={formData.notes} 
            onChange={e => handleChange('notes', e.target.value)} 
            rows={3}
            placeholder="Any additional notes or comments..."
          />
        </div>

      </div>

      <div className="flex justify-end gap-3 pt-6 border-t mt-6">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="clay-button bg-blue-600 text-white hover:bg-blue-700">
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}