
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UserEditForm({ user, isOpen, onClose, onUserUpdated, availableRoles = [] }) {
  const [formData, setFormData] = useState({
    user_id: '',
    first_name: '',
    last_name: '',
    email: '',
    employee_id: '',
    job_title: '',
    department: '',
    status: '',
    roles: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        user_id: user.user_id || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        employee_id: user.employee_id || '',
        job_title: user.job_title || '',
        department: user.department || '',
        status: user.status || 'active',
        roles: user.roles ? user.roles.map(role => role.id) : [],
      });
      setError(null);
      setSuccessMessage(null);
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleRoleToggle = (roleId, isChecked) => {
    setFormData(prevData => {
      const currentRoles = new Set(prevData.roles);
      if (isChecked) {
        currentRoles.add(roleId);
      } else {
        currentRoles.delete(roleId);
      }
      return {
        ...prevData,
        roles: Array.from(currentRoles),
      };
    });
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/users/${formData.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      const updatedUser = await response.json();
      setSuccessMessage('User updated successfully!');
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      // Optionally close the dialog after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] clay-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User: {user.first_name} {user.last_name}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 p-1">
          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account & Role Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account & Role Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Employee ID</Label>
                  <Input value={formData.employee_id} onChange={(e) => handleChange('employee_id', e.target.value)} />
                </div>
                <div>
                  <Label>Job Title</Label>
                  <Input value={formData.job_title} onChange={(e) => handleChange('job_title', e.target.value)} />
                </div>
                <div>
                  <Label>Department</Label>
                  <Select value={formData.department} onValueChange={(value) => handleChange('department', value)}>
                    <SelectTrigger><SelectValue placeholder="Select department..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="it">Information Technology</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Account Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Management */}
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4">
                {availableRoles.length > 0 ? (
                  availableRoles.map(role => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={formData.roles.includes(role.id)}
                        onCheckedChange={(isChecked) => handleRoleToggle(role.id, isChecked)}
                      />
                      <label
                        htmlFor={`role-${role.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {role.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No roles available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
