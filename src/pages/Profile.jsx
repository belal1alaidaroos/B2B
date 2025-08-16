
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Country } from '@/api/entities';
import { Territory } from '@/api/entities';
import { City } from '@/api/entities';
import { Branch } from '@/api/entities';
import { Department } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, Save, Camera, MapPin, Phone, Mail, Calendar, Briefcase, Loader2, Building, GitBranch } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    full_name: '',
    mobile: '',
    phone: '',
    employee_id: '',
    department_id: '', // Changed from department
    branch_id: '', // Added
    job_title: '',
    profile_image_url: '',
    date_of_birth: '',
    hire_date: '',
    address: {
      street: '',
      postal_code: '',
      country_id: '', // Added
      territory_id: '', // Added
      city_id: '' // Added
    },
    emergency_contact: {
      name: '',
      relationship: '',
      phone: ''
    },
    preferred_language: 'en',
    timezone: 'Asia/Dubai',
    theme: 'light',
    notes: ''
  });
  
  // Lookup data states
  const [countries, setCountries] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [cities, setCities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Filtered dropdown options states
  const [filteredTerritories, setFilteredTerritories] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // --- CASCADING DROPDOWN LOGIC ---

  // -> When Country changes, filter Territories
  useEffect(() => {
    if (formData.address.country_id) {
      const filtered = territories.filter(t => t.country_id === formData.address.country_id);
      setFilteredTerritories(filtered);
    } else {
      setFilteredTerritories([]);
    }
  }, [formData.address.country_id, territories]);

  // -> When Territory changes, filter Cities
  useEffect(() => {
    if (formData.address.territory_id) {
      const filtered = cities.filter(c => c.territory_id === formData.address.territory_id);
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  }, [formData.address.territory_id, cities]);
  
  // -> When City changes, filter Branches
  useEffect(() => {
    if (formData.address.city_id) {
      const filtered = branches.filter(b => b.city_id === formData.address.city_id);
      setFilteredBranches(filtered);
    } else {
      setFilteredBranches([]);
    }
  }, [formData.address.city_id, branches]);


  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [userData, countriesData, territoriesData, citiesData, branchesData, departmentsData] = await Promise.all([
        User.me(),
        Country.list(),
        Territory.list(),
        City.list(),
        Branch.list(),
        Department.list()
      ]);
      
      setUser(userData);
      setCountries(countriesData);
      setTerritories(territoriesData);
      setCities(citiesData);
      setBranches(branchesData);
      setDepartments(departmentsData);
      
      // Populate form data with existing user data
      const initialFormData = {
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        full_name: userData.full_name || '',
        mobile: userData.mobile || '',
        phone: userData.phone || '',
        employee_id: userData.employee_id || '',
        department_id: userData.department_id || '',
        branch_id: userData.branch_id || '',
        job_title: userData.job_title || '',
        profile_image_url: userData.profile_image_url || '',
        date_of_birth: userData.date_of_birth || '',
        hire_date: userData.hire_date || '',
        address: {
          street: userData.address?.street || '',
          postal_code: userData.address?.postal_code || '',
          country_id: userData.address?.country_id || '',
          territory_id: userData.address?.territory_id || '',
          city_id: userData.address?.city_id || '',
        },
        emergency_contact: {
          name: userData.emergency_contact?.name || '',
          relationship: userData.emergency_contact?.relationship || '',
          phone: userData.emergency_contact?.phone || ''
        },
        preferred_language: userData.preferred_language || 'en',
        timezone: userData.timezone || 'Asia/Dubai',
        theme: userData.theme || 'light',
        notes: userData.notes || ''
      };
      
      setFormData(initialFormData);

    } catch (error) {
      console.error("Error loading user data:", error);
      setMessage({ type: 'error', text: "Failed to load your profile." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationChange = (field, value) => {
    setFormData(prev => {
      const newFormData = { ...prev };
      
      if (field.startsWith('address.')) {
        const addressField = field.split('.')[1];
        newFormData.address = { ...newFormData.address, [addressField]: value };

        // Reset lower level selections if parent changes
        if (addressField === 'country_id') {
          newFormData.address.territory_id = '';
          newFormData.address.city_id = '';
          newFormData.branch_id = ''; // Also reset branch when country changes
        } else if (addressField === 'territory_id') {
          newFormData.address.city_id = '';
          newFormData.branch_id = ''; // Also reset branch when territory changes
        } else if (addressField === 'city_id') {
          newFormData.branch_id = ''; // Reset branch when city changes
        }
      } else if (field === 'branch_id') {
        newFormData.branch_id = value;
      }
      return newFormData;
    });
  };

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => {
        const newFormData = { ...prev, [field]: value };
        
        // Auto-generate full_name when first_name or last_name changes
        if (field === 'first_name' || field === 'last_name') {
          const firstName = field === 'first_name' ? value : newFormData.first_name;
          const lastName = field === 'last_name' ? value : newFormData.last_name;
          newFormData.full_name = `${firstName} ${lastName}`.trim();
        }
        return newFormData;
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      await User.updateMyUserData(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.active;
  };
  
  return (
    <div className="p-4 space-y-4 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">My Profile</h1>
          <p className="text-sm text-gray-600">Manage your personal information and preferences.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:scale-105 transition-transform duration-200 px-4 py-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </>
          )}
        </Button>
      </div>
      
      {message && (
        <Alert className={`border-${message.type === 'success' ? 'green' : 'red'}-200 bg-${message.type === 'success' ? 'green' : 'red'}-50`}>
          <AlertDescription className={`text-${message.type === 'success' ? 'green' : 'red'}-800`}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i} className="clay-card p-4">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            <Card className="clay-card p-4">
              <div className="flex flex-col items-center">
                <Skeleton className="w-32 h-32 rounded-full mb-4" />
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Personal Information */}
            <Card className="clay-card p-4">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserIcon className="w-5 h-5 text-emerald-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name" className="text-sm font-medium">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      className="mt-1 clay-element border-none"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="last_name" className="text-sm font-medium">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      className="mt-1 clay-element border-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobile" className="text-sm font-medium">Mobile Phone</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => handleChange('mobile', e.target.value)}
                      className="mt-1 clay-element border-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">Office Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="mt-1 clay-element border-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="date_of_birth" className="text-sm font-medium">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleChange('date_of_birth', e.target.value)}
                      className="mt-1 clay-element border-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="mt-1 clay-element border-none bg-gray-100/50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Information */}
            <Card className="clay-card p-4">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Work Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee_id" className="text-sm font-medium">Employee ID</Label>
                    <Input
                      id="employee_id"
                      value={formData.employee_id}
                      onChange={(e) => handleChange('employee_id', e.target.value)}
                      className="mt-1 clay-element border-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="job_title" className="text-sm font-medium">Job Title</Label>
                    <Input
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => handleChange('job_title', e.target.value)}
                      className="mt-1 clay-element border-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hire_date" className="text-sm font-medium">Hire Date</Label>
                    <Input
                      id="hire_date"
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => handleChange('hire_date', e.target.value)}
                      className="mt-1 clay-element border-none"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="department_id" className="text-sm font-medium">Department</Label>
                    <Select
                      value={formData.department_id}
                      onValueChange={(value) => handleChange('department_id', value)}
                    >
                      <SelectTrigger id="department_id" className="mt-1 clay-element border-none">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="clay-card">
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* HIERARCHICAL LOOKUPS FOR BRANCH */}
                  <div className="md:col-span-2 border-t border-gray-200/50 pt-4 mt-4">
                     <h4 className="text-md font-semibold mb-2 flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-emerald-700" />
                        Branch Assignment
                    </h4>
                  </div>
                  
                  <div>
                    <Label>Country</Label>
                    <Select value={formData.address.country_id} onValueChange={(v) => handleLocationChange('address.country_id', v)}>
                      <SelectTrigger className="mt-1 clay-element border-none"><SelectValue placeholder="Select Country" /></SelectTrigger>
                      <SelectContent className="clay-card">{countries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Territory</Label>
                    <Select value={formData.address.territory_id} onValueChange={(v) => handleLocationChange('address.territory_id', v)} disabled={!formData.address.country_id}>
                      <SelectTrigger className="mt-1 clay-element border-none"><SelectValue placeholder="Select Territory" /></SelectTrigger>
                      <SelectContent className="clay-card">{filteredTerritories.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>City</Label>
                    <Select value={formData.address.city_id} onValueChange={(v) => handleLocationChange('address.city_id', v)} disabled={!formData.address.territory_id}>
                      <SelectTrigger className="mt-1 clay-element border-none"><SelectValue placeholder="Select City" /></SelectTrigger>
                      <SelectContent className="clay-card">{filteredCities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Branch</Label>
                    <Select value={formData.branch_id} onValueChange={(v) => handleLocationChange('branch_id', v)} disabled={!formData.address.city_id}>
                      <SelectTrigger className="mt-1 clay-element border-none"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                      <SelectContent className="clay-card">{filteredBranches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="clay-card p-4">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street" className="text-sm font-medium">Street Address</Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) => handleChange('address.street', e.target.value)}
                      className="mt-1 clay-element border-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postal_code" className="text-sm font-medium">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.address.postal_code}
                      onChange={(e) => handleChange('address.postal_code', e.target.value)}
                      className="mt-1 clay-element border-none"
                    />
                  </div>

                  <div className="md:col-span-2 pt-2">
                     <p className="text-sm text-gray-500">Country, Territory, and City are determined by your branch assignment.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="clay-card p-4">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="w-5 h-5 text-red-600" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergency_name" className="text-sm font-medium">Contact Name</Label>
                    <Input
                      id="emergency_name"
                      value={formData.emergency_contact.name}
                      onChange={(e) => handleChange('emergency_contact.name', e.target.value)}
                      className="mt-1 clay-element border-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergency_relationship" className="text-sm font-medium">Relationship</Label>
                    <Input
                      id="emergency_relationship"
                      value={formData.emergency_contact.relationship}
                      onChange={(e) => handleChange('emergency_contact.relationship', e.target.value)}
                      className="mt-1 clay-element border-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="emergency_phone" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="emergency_phone"
                      type="tel"
                      value={formData.emergency_contact.phone}
                      onChange={(e) => handleChange('emergency_contact.phone', e.target.value)}
                      className="mt-1 clay-element border-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Preferences */}
            <Card className="clay-card p-4">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="w-5 h-5 text-gray-600" />
                  System Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferred_language" className="text-sm font-medium">Language</Label>
                    <Select
                      value={formData.preferred_language}
                      onValueChange={(value) => handleChange('preferred_language', value)}
                    >
                      <SelectTrigger id="preferred_language" className="mt-1 clay-element border-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="clay-card">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">Arabic (العربية)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="theme" className="text-sm font-medium">Theme</Label>
                    <Select
                      value={formData.theme}
                      onValueChange={(value) => handleChange('theme', value)}
                    >
                      <SelectTrigger id="theme" className="mt-1 clay-element border-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="clay-card">
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="timezone" className="text-sm font-medium">Timezone</Label>
                    <Input
                      id="timezone"
                      value={formData.timezone}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                      className="mt-1 clay-element border-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      className="mt-1 clay-element border-none h-20"
                      placeholder="Additional notes or comments..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Summary */}
          <div className="space-y-4">
            <Card className="clay-card p-4">
              <CardContent className="p-0">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="w-32 h-32 clay-element p-1 mb-4">
                    <AvatarImage src={formData.profile_image_url} alt={formData.full_name} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-4xl">
                      {(formData.first_name?.[0] || '') + (formData.last_name?.[0] || '') || <UserIcon className="w-16 h-16" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h2 className="text-xl font-bold text-gray-800 mb-1">
                    {formData.full_name || 'Enter your name'}
                  </h2>
                  
                  <p className="text-gray-600 mb-2">
                    {formData.job_title || 'Job title not set'}
                  </p>
                  
                  <Badge className={`${getStatusColor(user?.status || 'active')} border-none mb-4`}>
                    {user?.status || 'Active'}
                  </Badge>

                  <div className="w-full space-y-2">
                    <Label htmlFor="profile_image_url" className="text-sm font-medium">Profile Image URL</Label>
                    <Input
                      id="profile_image_url"
                      type="url"
                      placeholder="https://..."
                      value={formData.profile_image_url}
                      onChange={(e) => handleChange('profile_image_url', e.target.value)}
                      className="clay-element border-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info Card */}
            <Card className="clay-card p-4">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">{user?.email || 'No email'}</span>
                </div>
                
                {formData.mobile && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">{formData.mobile}</span>
                  </div>
                )}
                
                {formData.department_id && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-600 capitalize">
                      {departments.find(d => d.id === formData.department_id)?.name || `Dept ID: ${formData.department_id}`}
                    </span>
                  </div>
                )}

                {formData.branch_id && (
                  <div className="flex items-center gap-3 text-sm">
                    <GitBranch className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600 capitalize">
                      {branches.find(b => b.id === formData.branch_id)?.name || `Branch ID: ${formData.branch_id}`}
                    </span>
                  </div>
                )}
                
                {formData.hire_date && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-600">Hired: {new Date(formData.hire_date).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
