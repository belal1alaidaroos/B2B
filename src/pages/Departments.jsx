
import React, { useState, useEffect } from 'react';
import { Department } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Building, Power, PowerOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    arabic_name: '',
    code: '',
    integration_key: '',
    is_active: true,
    from_date: '',
    to_date: ''
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setIsLoading(true);
    const items = await Department.list();
    setDepartments(items);
    setIsLoading(false);
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name || '',
      arabic_name: department.arabic_name || '',
      code: department.code || '',
      integration_key: department.integration_key || '',
      is_active: department.is_active !== undefined ? department.is_active : true,
      from_date: department.from_date || '',
      to_date: department.to_date || ''
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingDepartment(null);
    setFormData({
      name: '',
      arabic_name: '',
      code: '',
      integration_key: '',
      is_active: true,
      from_date: '',
      to_date: ''
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (department) => {
    try {
      await Department.update(department.id, { ...department, is_active: !department.is_active });
      loadDepartments();
    } catch (error) {
      console.error("Error updating department status:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      await Department.delete(id);
      loadDepartments();
    }
  };

  const handleSave = async () => {
    if (!formData.name) return;
    
    const dataToSend = {
        name: formData.name,
        arabic_name: formData.arabic_name || '',
        code: formData.code || '',
        integration_key: formData.integration_key || '',
        is_active: formData.is_active,
        from_date: formData.from_date || null,
        to_date: formData.to_date || null
    };

    if (editingDepartment) {
      await Department.update(editingDepartment.id, dataToSend);
    } else {
      await Department.create(dataToSend);
    }
    loadDepartments();
    setIsDialogOpen(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Manage Departments</h1>
        <Button onClick={handleAddNew} className="clay-button">
          <Plus className="w-4 h-4 mr-2" />
          Add New Department
        </Button>
      </div>

      <Card className="clay-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-emerald-600" /> All Departments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>English Name</TableHead>
                  <TableHead>Arabic Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Integration Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>From Date</TableHead>
                  <TableHead>To Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map(dept => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell className="font-arabic">{dept.arabic_name || '-'}</TableCell>
                    <TableCell><span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{dept.code || '-'}</span></TableCell>
                    <TableCell className="text-sm text-gray-600">{dept.integration_key || '-'}</TableCell>
                    <TableCell>
                      <Badge className={`${dept.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {dept.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{dept.from_date || '-'}</TableCell>
                    <TableCell className="text-sm">{dept.to_date || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleToggleActive(dept)} title={dept.is_active ? "Deactivate" : "Activate"}>
                        {dept.is_active ? <PowerOff className="w-4 h-4 text-orange-500" /> : <Power className="w-4 h-4 text-green-500" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(dept)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="clay-card sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingDepartment ? 'Edit Department' : 'Add New Department'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>English Name *</Label>
                <Input
                  placeholder="Department Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div>
                <Label>Arabic Name</Label>
                <Input
                  placeholder="اسم القسم"
                  value={formData.arabic_name}
                  onChange={(e) => handleInputChange('arabic_name', e.target.value)}
                  className="text-right"
                  dir="rtl"
                />
              </div>
            
              <div>
                <Label>Department Code</Label>
                <Input
                  placeholder="e.g., HR, IT, SALES"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  className="font-mono"
                />
              </div>
              <div>
                <Label>Integration Key</Label>
                <Input
                  placeholder="Unique key for external systems"
                  value={formData.integration_key}
                  onChange={(e) => handleInputChange('integration_key', e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={formData.from_date}
                  onChange={(e) => handleInputChange('from_date', e.target.value)}
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={formData.to_date}
                  onChange={(e) => handleInputChange('to_date', e.target.value)}
                />
              </div>

            </div>

            <div className="flex items-center space-x-2 pt-4 border-t">
              <Switch 
                id="is_active" 
                checked={formData.is_active} 
                onCheckedChange={(checked) => handleInputChange('is_active', checked)} 
              />
              <Label htmlFor="is_active">Department is Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="clay-button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
