
import React, { useState, useEffect } from 'react';
import { Job } from '@/api/entities';
import { Briefcase, Plus, Edit, Trash2, Search, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const categoryColors = {
  construction: 'bg-orange-100 text-orange-800',
  hospitality: 'bg-pink-100 text-pink-800',
  healthcare: 'bg-green-100 text-green-800',
  manufacturing: 'bg-blue-100 text-blue-800',
  logistics: 'bg-purple-100 text-purple-800',
  technical: 'bg-indigo-100 text-indigo-800',
  administrative: 'bg-gray-100 text-gray-800',
  other: 'bg-yellow-100 text-yellow-800'
};

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    job_title: '',
    arabic_name: '',
    category: 'other',
    code: '',
    integration_key: '',
    is_active: true, // New field
    from_date: '',   // New field
    to_date: ''      // New field
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const jobsData = await Job.list('-created_date');
      setJobs(jobsData || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingJob(null);
    setFormData({
      job_title: '',
      arabic_name: '',
      category: 'other',
      code: '',
      integration_key: '',
      is_active: true, // Initialize
      from_date: '',   // Initialize
      to_date: ''      // Initialize
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      job_title: job.job_title || '',
      arabic_name: job.arabic_name || '',
      category: job.category || 'other',
      code: job.code || '',
      integration_key: job.integration_key || '',
      is_active: job.is_active !== undefined ? job.is_active : true, // Handle undefined/null, default to true
      from_date: job.from_date ? new Date(job.from_date).toISOString().split('T')[0] : '', // Format for date input
      to_date: job.to_date ? new Date(job.to_date).toISOString().split('T')[0] : ''       // Format for date input
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this profession?')) {
      try {
        await Job.delete(jobId);
        loadJobs();
      } catch (error) {
        console.error("Error deleting job:", error);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.job_title || !formData.code) {
      alert('Job Title and Code are required.');
      return;
    }
    
    try {
      if (editingJob) {
        await Job.update(editingJob.id, formData);
      } else {
        await Job.create(formData);
      }
      loadJobs();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving job:", error);
    }
  };

  const handleToggleActive = async (job) => {
    try {
      const updatedJob = { ...job, is_active: !job.is_active };
      await Job.update(job.id, updatedJob);
      loadJobs();
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.arabic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Professions</h1>
          <p className="text-sm text-gray-600">Manage all profession types in the system.</p>
        </div>
        <Button onClick={handleAddNew} className="clay-button bg-emerald-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Profession
        </Button>
      </div>

      <div className="clay-card p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search professions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map(job => (
              <div key={job.id} className="flex items-center justify-between p-4 clay-element">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Briefcase className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{job.job_title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${categoryColors[job.category]} text-xs`}>
                        {job.category}
                      </Badge>
                      <span className="text-sm text-gray-500">Code: {job.code}</span>
                      {job.arabic_name && (
                        <span className="text-sm text-gray-500">• {job.arabic_name}</span>
                      )}
                      <Badge className={`text-xs ${job.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {job.from_date && (
                        <span className="text-sm text-gray-500">
                          From: {new Date(job.from_date).toLocaleDateString()}
                        </span>
                      )}
                      {job.to_date && (
                        <span className="text-sm text-gray-500">
                          To: {new Date(job.to_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleToggleActive(job)} title={job.is_active ? 'Deactivate Job' : 'Activate Job'}>
                    <Power className={`w-4 h-4 ${job.is_active ? 'text-green-500' : 'text-red-500'}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(job)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(job.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredJobs.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No professions found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="clay-card sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingJob ? 'Edit Profession' : 'Add New Profession'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="job_title">Profession Title *</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={e => setFormData(prev => ({...prev, job_title: e.target.value}))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="arabic_name">Arabic Name</Label>
                  <Input
                    id="arabic_name"
                    value={formData.arabic_name}
                    onChange={e => setFormData(prev => ({...prev, arabic_name: e.target.value}))}
                    className="mt-1"
                    dir="rtl"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={value => setFormData(prev => ({...prev, category: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="hospitality">Hospitality</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="logistics">Logistics</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={e => setFormData(prev => ({...prev, code: e.target.value}))}
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="integration_key">Integration Key</Label>
                  <Input
                    id="integration_key"
                    value={formData.integration_key}
                    onChange={e => setFormData(prev => ({...prev, integration_key: e.target.value}))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="from_date">From Date</Label>
                  <Input
                    id="from_date"
                    type="date"
                    value={formData.from_date}
                    onChange={e => setFormData(prev => ({...prev, from_date: e.target.value}))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="to_date">To Date</Label>
                  <Input
                    id="to_date"
                    type="date"
                    value={formData.to_date}
                    onChange={e => setFormData(prev => ({...prev, to_date: e.target.value}))}
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-2 flex items-center space-x-2 pt-2">
                  <Input
                    id="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData(prev => ({...prev, is_active: e.target.checked}))}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_active" className="mb-0">Is Active</Label>
                </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="clay-button bg-emerald-500 text-white">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
