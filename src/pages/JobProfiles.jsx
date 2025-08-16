
import React, { useState, useEffect } from 'react';
import { JobProfile } from '@/api/entities';
import { Job } from '@/api/entities';
import { SkillLevel } from '@/api/entities';
import { CostComponent } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Briefcase, Power, PowerOff, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import JobProfileForm from '../components/pricing_setup/JobProfileForm';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { logAuditEvent } from '@/components/common/AuditService';

export default function JobProfilesPage() {
    const [jobProfiles, setJobProfiles] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [skillLevels, setSkillLevels] = useState([]);
    const [costComponents, setCostComponents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);

    // Filter states
    const [filters, setFilters] = useState({
        job_id: 'all',
        category: 'all',
        skill_level: 'all',
        status: 'all'
    });

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [profilesData, jobsData, skillsData, componentsData] = await Promise.all([
                JobProfile.list('-updated_date'), // Already sorts by updated_date in descending order
                Job.list(),
                SkillLevel.list(),
                CostComponent.filter({ is_active: true, scope: 'line_item' })
            ]);

            setJobProfiles(profilesData || []);
            setJobs(jobsData || []);
            setSkillLevels(skillsData || []);

            const applicableComponents = (componentsData || []).filter(c =>
                c.applicable_for && Array.isArray(c.applicable_for) && c.applicable_for.includes('job_profile')
            );
            setCostComponents(applicableComponents);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSave = () => {
        setIsFormOpen(false);
        setEditingProfile(null);
        loadData();
    };

    const handleAddNew = () => {
        setEditingProfile(null);
        setIsFormOpen(true);
    };

    const handleEdit = (profile) => {
        setEditingProfile(profile);
        setIsFormOpen(true);
    };

    const handleToggleActive = async (profile) => {
        try {
            const newStatus = !profile.active;
            await JobProfile.update(profile.id, { active: newStatus });
            await logAuditEvent({
                action: 'update',
                entityType: 'JobProfile',
                entityId: profile.id,
                entityName: profile.job_title,
                oldValues: { active: profile.active },
                newValues: { active: newStatus }
            });
            loadData();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDelete = async (id) => {
        const itemToDelete = jobProfiles.find(p => p.id === id);
        if (window.confirm('Are you sure you want to delete this job profile?')) {
            try {
                await JobProfile.delete(id);
                if (itemToDelete) { // Ensure itemToDelete exists before logging
                    await logAuditEvent({
                        action: 'delete',
                        entityType: 'JobProfile',
                        entityId: id,
                        entityName: itemToDelete.job_title,
                        oldValues: itemToDelete
                    });
                }
                loadData();
            } catch (error) {
                console.error("Error deleting job profile:", error);
            }
        }
    };

    const getJobName = (jobId) => {
        const job = jobs.find(j => j.id === jobId);
        return job ? job.job_title : 'Unknown Job';
    };

    // Helper function for currency formatting
    const formatCurrency = (amount, currency = 'SAR') => {
        if (typeof amount !== 'number') return amount;
        return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
    };

    // Apply filters to job profiles
    const filteredProfiles = jobProfiles.filter(profile => {
        const matchesSearch = profile.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             profile.arabic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             profile.code?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesJob = filters.job_id === 'all' || profile.job_id === filters.job_id;
        const matchesCategory = filters.category === 'all' || profile.category === filters.category;
        const matchesSkillLevel = filters.skill_level === 'all' || profile.skill_level_id === filters.skill_level;
        const matchesStatus = filters.status === 'all' ||
                             (filters.status === 'active' && profile.active !== false) ||
                             (filters.status === 'inactive' && profile.active === false);

        return matchesSearch && matchesJob && matchesCategory && matchesSkillLevel && matchesStatus;
    });

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Job Profiles</h1>
                    <p className="text-sm text-gray-600">Manage detailed job profiles with specific skills and cost structures.</p>
                </div>
                <Button onClick={handleAddNew} className="clay-button bg-emerald-500 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Job Profile
                </Button>
            </div>

            {/* Filters and Search */}
            <Card className="clay-card">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4 mb-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search job profiles..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            <Select value={filters.job_id} onValueChange={(value) => setFilters(prev => ({ ...prev, job_id: value }))}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Profession" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Professions</SelectItem>
                                    {jobs.map(job => (
                                        <SelectItem key={job.id} value={job.id}>{job.job_title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
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

                            <Select value={filters.skill_level} onValueChange={(value) => setFilters(prev => ({ ...prev, skill_level: value }))}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Skill Level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Skill Levels</SelectItem>
                                    {skillLevels.map(level => (
                                        <SelectItem key={level.id} value={level.id}>{level.display_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Job Profiles List */}
            <Card className="clay-card">
                <CardContent className="p-4">
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array(5).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredProfiles.map(profile => (
                                <div key={profile.id} className="flex items-center justify-between p-4 clay-element rounded-lg hover:scale-[1.01] transition-transform duration-200">
                                    <div className="flex items-center gap-3">
                                       <div className={`p-2 rounded-lg ${profile.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                                        <Briefcase className={`w-5 h-5 ${profile.active ? 'text-green-700' : 'text-gray-500'}`} />
                                      </div>
                                      <div>
                                        <h3 className="font-semibold">{profile.job_title}</h3>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-gray-500">Base Cost: {formatCurrency(profile.base_cost, 'SAR')}</p>
                                            {profile.category && <Badge variant="outline">{profile.category}</Badge>}
                                            <Badge variant="outline" className="text-blue-700">
                                              {getJobName(profile.job_id)}
                                            </Badge>
                                            <Badge className={`${profile.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {profile.active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        {profile.code && (
                                          <p className="text-xs text-gray-400 font-mono mt-1">Code: {profile.code}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <Button variant="ghost" size="icon" onClick={() => handleToggleActive(profile)}>
                                        {profile.active ? <PowerOff className="w-4 h-4 text-orange-600" /> : <Power className="w-4 h-4 text-green-600" />}
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => handleEdit(profile)}>
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => handleDelete(profile.id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </Button>
                                    </div>
                                </div>
                            ))}

                            {filteredProfiles.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-medium">No job profiles found</p>
                                    <p className="text-sm">Try adjusting your search criteria or create a new job profile.</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[80vw] lg:max-w-[1000px] clay-card max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProfile ? 'Edit Job Profile' : 'Add New Job Profile'}</DialogTitle>
                        <DialogDescription>
                            {editingProfile ? 'Update the details for this job profile.' : 'Create a detailed job profile with specific skills and cost structure.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <JobProfileForm
                            jobProfile={editingProfile}
                            jobs={jobs}
                            skillLevels={skillLevels}
                            costComponents={costComponents}
                            onSave={handleFormSave}
                            onCancel={() => setIsFormOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
