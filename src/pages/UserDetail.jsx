
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from '@/api/entities';
import { Role } from '@/api/entities';
import { Country } from '@/api/entities';
import { City } from '@/api/entities';
import { Territory } from '@/api/entities';
import { Branch } from '@/api/entities';
import { Department } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Save, User as UserIcon, AlertTriangle, Shield, PowerOff, UserPlus, CheckCircle, Plus } from 'lucide-react';

import ManageRolesModal from '../components/users/ManageRolesModal';

const EditableFormField = ({ label, value, onChange, type = "text", options = null, required = false }) => (
  <div>
    <Label className="text-xs text-gray-500">{label}{required && <span className="text-red-500 ml-1">*</span>}</Label>
    {options ? (
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="h-9 mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : (
      <Input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 mt-1"
      />
    )}
  </div>
);

export default function UserDetailPage() {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [formOptions, setFormOptions] = useState({
    departments: [],
    branches: [],
    cities: [],
    territories: [],
    countries: []
  });
  const location = useLocation();

  const getUserId = () => {
    const params = new URLSearchParams(location.search);
    return params.get('id');
  };

  useEffect(() => {
    const userId = getUserId();
    if (userId) {
      loadUserData(userId);
    } else {
      setIsLoading(false);
    }
  }, [location.search]);

  const loadUserData = async (userId) => {
    setIsLoading(true);
    try {
      const [
        userData, 
        allRoles, 
        departmentsData, 
        branchesData, 
        citiesData, 
        territoriesData, 
        countriesData
      ] = await Promise.all([
        User.filter({ id: userId }).then(results => results[0]), // FIX: Use User.filter instead of User.get to avoid backend error
        Role.list(),
        Department.list(),
        Branch.list(),
        City.list(),
        Territory.list(),
        Country.list(),
      ]);
      
      if (!userData) {
        throw new Error("User not found");
      }

      setUser(userData);
      setRoles(allRoles);

      const mapToOptions = (items) => items.map(item => ({ value: item.id, label: item.name }));

      setFormOptions({
          departments: mapToOptions(departmentsData),
          branches: mapToOptions(branchesData),
          cities: mapToOptions(citiesData),
          territories: mapToOptions(territoriesData),
          countries: countriesData.map(c => ({value: c.id, label: c.name})),
      });
      
      // Initialize form data
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        arabic_name: userData.arabic_name || '',
        employee_id: userData.employee_id || '',
        email: userData.email || '',
        mobile: userData.mobile || '',
        phone: userData.phone || '',
        job_title: userData.job_title || '',
        department: userData.department || '',
        branch: userData.branch || '',
        status: userData.status || 'active',
        address: {
          country: userData.address?.country || '',
          city: userData.address?.city || '',
          state: userData.address?.state || '',
          street: userData.address?.street || '',
          postal_code: userData.address?.postal_code || ''
        }
      });
    } catch (error) {
      console.error("Error loading user data:", error.message || error);
      setActionMessage({ type: 'error', text: 'Failed to load user data. The user may not exist or there was a server error.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
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
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await User.update(user.id, formData);
      setActionMessage({ type: 'success', text: 'User updated successfully!' });
      setTimeout(() => setActionMessage(null), 3000);
      setUser(prev => ({ ...prev, ...formData }));
    } catch (error) {
      console.error("Failed to save user:", error);
      setActionMessage({ type: 'error', text: 'Failed to save user data.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRolesUpdated = () => {
    setActionMessage({ type: 'success', text: 'User roles updated successfully!' });
    setTimeout(() => setActionMessage(null), 3000);
    loadUserData(user.id);
  };

  const handleStatusToggle = async () => {
    if (!user) return;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await User.update(user.id, { status: newStatus });
      setActionMessage({ type: 'success', text: `User has been ${newStatus}.` });
      setTimeout(() => setActionMessage(null), 3000);
      loadUserData(user.id);
    } catch (error) {
      console.error("Failed to update status:", error);
      setActionMessage({ type: 'error', text: 'Failed to update user status.' });
    }
  };

  if (isLoading) {
    return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl text-gray-700">User not found.</h2>
        <p className="text-gray-500">Please select a user from the list.</p>
      </div>
    );
  }

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending', label: 'Pending' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Action Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-gray-800 flex-1">
          <span className="text-gray-500">USER</span> / {user.full_name?.toUpperCase() || 'UNNAMED USER'}
        </h1>
        <Button 
          variant="outline" 
          onClick={handleSave} 
          disabled={isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="outline" onClick={handleStatusToggle}>
          {user.status === 'active' ? (
            <><PowerOff className="w-4 h-4 mr-2" />Disable</>
          ) : (
            <><CheckCircle className="w-4 h-4 mr-2" />Enable</>
          )}
        </Button>
        <Button variant="outline"><UserPlus className="w-4 h-4 mr-2" />New</Button>
      </header>

      <main className="p-6 space-y-6">
        {actionMessage && (
            <Alert className={`${actionMessage.type === 'success' ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}`}>
              <AlertDescription>{actionMessage.text}</AlertDescription>
            </Alert>
        )}
        
        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
          <AlertTriangle className="h-4 w-4 !text-yellow-500" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            The information provided in this form is viewable by the entire organization.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="col-span-3 space-y-6">
            
            {/* Personal Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserIcon className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <EditableFormField 
                    label="First Name" 
                    value={formData.first_name}
                    onChange={(value) => handleFieldChange('first_name', value)}
                    required
                  />
                  <EditableFormField 
                    label="Last Name" 
                    value={formData.last_name}
                    onChange={(value) => handleFieldChange('last_name', value)}
                    required
                  />
                  <EditableFormField 
                    label="Arabic Name" 
                    value={formData.arabic_name}
                    onChange={(value) => handleFieldChange('arabic_name', value)}
                  />
                  <EditableFormField 
                    label="Employee ID" 
                    value={formData.employee_id}
                    onChange={(value) => handleFieldChange('employee_id', value)}
                  />
                  <EditableFormField 
                    label="Email" 
                    value={formData.email}
                    onChange={(value) => handleFieldChange('email', value)}
                    type="email"
                    required
                  />
                  <EditableFormField 
                    label="Mobile Phone" 
                    value={formData.mobile}
                    onChange={(value) => handleFieldChange('mobile', value)}
                    type="tel"
                  />
                  <EditableFormField 
                    label="Office Phone" 
                    value={formData.phone}
                    onChange={(value) => handleFieldChange('phone', value)}
                    type="tel"
                  />
                  <EditableFormField 
                    label="Job Title" 
                    value={formData.job_title}
                    onChange={(value) => handleFieldChange('job_title', value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Work Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="w-5 h-5" />
                  Work Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <EditableFormField 
                    label="Department" 
                    value={formData.department}
                    onChange={(value) => handleFieldChange('department', value)}
                    options={formOptions.departments}
                  />
                  <EditableFormField 
                    label="Branch" 
                    value={formData.branch}
                    onChange={(value) => handleFieldChange('branch', value)}
                    options={formOptions.branches}
                  />
                  <EditableFormField 
                    label="Status" 
                    value={formData.status}
                    onChange={(value) => handleFieldChange('status', value)}
                    options={statusOptions}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Address Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <EditableFormField 
                    label="Country" 
                    value={formData.address.country}
                    onChange={(value) => handleFieldChange('address.country', value)}
                    options={formOptions.countries}
                  />
                  <EditableFormField 
                    label="City" 
                    value={formData.address.city}
                    onChange={(value) => handleFieldChange('address.city', value)}
                    options={formOptions.cities}
                  />
                  <EditableFormField 
                    label="State/Territory" 
                    value={formData.address.state}
                    onChange={(value) => handleFieldChange('address.state', value)}
                    options={formOptions.territories}
                  />
                  <EditableFormField 
                    label="Postal Code" 
                    value={formData.address.postal_code}
                    onChange={(value) => handleFieldChange('address.postal_code', value)}
                  />
                  <div className="col-span-2">
                    <EditableFormField 
                      label="Street Address" 
                      value={formData.address.street}
                      onChange={(value) => handleFieldChange('address.street', value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center">
                <Avatar className="w-20 h-20 mb-4">
                  <AvatarFallback className="text-lg">
                    {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">{user.full_name || `${user.first_name} ${user.last_name}`}</h3>
                <p className="text-sm text-gray-600 mb-3">{user.job_title}</p>
                <Badge className={`${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                </Badge>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Roles</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsRolesModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map(roleId => {
                      const role = roles.find(r => r.id === roleId);
                      return role ? (
                        <Badge key={role.id} variant="secondary" className="mr-1 mb-1">
                          {role.display_name}
                        </Badge>
                      ) : null;
                    })
                  ) : (
                    <p className="text-sm text-gray-500">No roles assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ManageRolesModal 
        user={user}
        isOpen={isRolesModalOpen}
        onClose={() => setIsRolesModalOpen(false)}
        onRolesUpdated={handleRolesUpdated}
        availableRoles={roles}
      />
    </div>
  );
}
