
import React, { useState, useEffect } from 'react';
import { Territory } from '@/api/entities';
import { Country } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, MapPin, Power, PowerOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export default function TerritoriesPage() {
  const [territories, setTerritories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    arabic_name: '',
    code: '',
    country_id: '',
    integration_key: '',
    is_active: true,
    from_date: '',
    to_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [territoriesData, countriesData] = await Promise.all([
        Territory.list(),
        Country.list()
      ]);
      setTerritories(territoriesData);
      setCountries(countriesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCountryName = (countryId) => {
    const country = countries.find(c => c.id === countryId);
    return country ? country.name : 'Unknown Country';
  };

  const handleEdit = (territory) => {
    setEditingTerritory(territory);
    setFormData({
      name: territory.name || '',
      arabic_name: territory.arabic_name || '',
      code: territory.code || '',
      country_id: territory.country_id || '',
      integration_key: territory.integration_key || '',
      is_active: territory.is_active !== undefined ? territory.is_active : true,
      from_date: territory.from_date || '',
      to_date: territory.to_date || ''
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingTerritory(null);
    setFormData({
      name: '',
      arabic_name: '',
      code: '',
      country_id: '',
      integration_key: '',
      is_active: true,
      from_date: '',
      to_date: ''
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (territory) => {
    try {
      await Territory.update(territory.id, { ...territory, is_active: !territory.is_active });
      loadData();
    } catch (error) {
      console.error("Error updating territory status:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this territory?')) {
      await Territory.delete(id);
      loadData();
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.country_id) {
      alert('Name and Country are required.');
      return;
    }
    
    const dataToSend = {
      name: formData.name,
      arabic_name: formData.arabic_name || '',
      code: formData.code || '',
      country_id: formData.country_id,
      integration_key: formData.integration_key || '',
      is_active: formData.is_active,
      from_date: formData.from_date || null,
      to_date: formData.to_date || null
    };

    if (editingTerritory) {
      await Territory.update(editingTerritory.id, dataToSend);
    } else {
      await Territory.create(dataToSend);
    }
    loadData();
    setIsDialogOpen(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Manage Territories</h1>
        <Button onClick={handleAddNew} className="clay-button">
          <Plus className="w-4 h-4 mr-2" />
          Add New Territory
        </Button>
      </div>

      <Card className="clay-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-600" /> All Territories</CardTitle>
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
                  <TableHead>Country</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Integration Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>From Date</TableHead>
                  <TableHead>To Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {territories.map(territory => (
                  <TableRow key={territory.id}>
                    <TableCell className="font-medium">{territory.name}</TableCell>
                    <TableCell className="font-arabic">{territory.arabic_name || '-'}</TableCell>
                    <TableCell>{getCountryName(territory.country_id)}</TableCell>
                    <TableCell><span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{territory.code || '-'}</span></TableCell>
                    <TableCell className="text-sm text-gray-600">{territory.integration_key || '-'}</TableCell>
                    <TableCell>
                      <Badge className={`${territory.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {territory.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{territory.from_date || '-'}</TableCell>
                    <TableCell className="text-sm">{territory.to_date || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleToggleActive(territory)} title={territory.is_active ? "Deactivate" : "Activate"}>
                        {territory.is_active ? <PowerOff className="w-4 h-4 text-orange-500" /> : <Power className="w-4 h-4 text-green-500" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(territory)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(territory.id)} className="text-red-500">
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
            <DialogTitle>{editingTerritory ? 'Edit Territory' : 'Add New Territory'}</DialogTitle>
            <DialogDescription>
              {editingTerritory ? 'Update the territory information below.' : 'Create a new territory by filling in the details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country_id">Country *</Label>
                <Select value={formData.country_id} onValueChange={(value) => handleInputChange('country_id', value)}>
                  <SelectTrigger id="country_id">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country.id} value={country.id}>{country.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">English Name *</Label>
                <Input
                  id="name"
                  placeholder="Territory Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="arabic_name">Arabic Name</Label>
                <Input
                  id="arabic_name"
                  placeholder="اسم الإقليم"
                  value={formData.arabic_name}
                  onChange={(e) => handleInputChange('arabic_name', e.target.value)}
                  className="text-right"
                  dir="rtl"
                />
              </div>
              <div>
                <Label htmlFor="code">Territory Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., DU, SHJ"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="integration_key">Integration Key</Label>
                <Input
                  id="integration_key"
                  placeholder="Unique key for external systems"
                  value={formData.integration_key}
                  onChange={(e) => handleInputChange('integration_key', e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
               <div>
                <Label htmlFor="from_date">From Date</Label>
                <Input
                  id="from_date"
                  type="date"
                  value={formData.from_date}
                  onChange={(e) => handleInputChange('from_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="to_date">To Date</Label>
                <Input
                  id="to_date"
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
              <Label htmlFor="is_active">Territory is Active</Label>
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
