
import React, { useState, useEffect } from 'react';
import { Branch } from '@/api/entities';
import { Country } from '@/api/entities';
import { Territory } from '@/api/entities';
import { City } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, GitBranch } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [countries, setCountries] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredTerritories, setFilteredTerritories] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    arabic_name: '',
    code: '',
    country_id: '',
    territory_id: '',
    city_id: '',
    integration_key: '',
    is_active: true, // New field
    from_date: '',   // New field
    to_date: ''      // New field
  });

  useEffect(() => {
    loadData();
  }, []);

  // Filter territories based on selected country
  useEffect(() => {
    if (formData.country_id) {
      const filtered = territories.filter(t => t.country_id === formData.country_id);
      setFilteredTerritories(filtered);
      
      // Reset territory and city selection if current selections are not valid
      if (formData.territory_id && !filtered.find(t => t.id === formData.territory_id)) {
        setFormData(prev => ({ ...prev, territory_id: '', city_id: '' }));
      }
    } else {
      setFilteredTerritories([]);
      setFormData(prev => ({ ...prev, territory_id: '', city_id: '' }));
    }
  }, [formData.country_id, territories]);

  // Filter cities based on selected territory
  useEffect(() => {
    if (formData.territory_id) {
      const filtered = cities.filter(c => c.territory_id === formData.territory_id);
      setFilteredCities(filtered);
      
      // Reset city selection if current selection is not valid for the new territory
      if (formData.city_id && !filtered.find(c => c.id === formData.city_id)) {
        setFormData(prev => ({ ...prev, city_id: '' }));
      }
    } else {
      setFilteredCities([]);
      setFormData(prev => ({ ...prev, city_id: '' }));
    }
  }, [formData.territory_id, cities]);

  // When dialog opens with existing data, ensure filtered options are set correctly
  useEffect(() => {
    if (isDialogOpen && editingBranch && territories.length > 0 && cities.length > 0) {
      // Set filtered territories for existing branch
      if (editingBranch.country_id) {
        const filteredTerrs = territories.filter(t => t.country_id === editingBranch.country_id);
        setFilteredTerritories(filteredTerrs);
        
        // Set filtered cities for existing branch
        if (editingBranch.territory_id) {
          const filteredCits = cities.filter(c => c.territory_id === editingBranch.territory_id);
          setFilteredCities(filteredCits);
        }
      }
    }
  }, [isDialogOpen, editingBranch, territories, cities]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [branchesData, countriesData, territoriesData, citiesData] = await Promise.all([
        Branch.list(),
        Country.list(),
        Territory.list(),
        City.list()
      ]);
      setBranches(branchesData);
      setCountries(countriesData);
      setTerritories(territoriesData);
      setCities(citiesData);
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

  const getTerritoryName = (territoryId) => {
    const territory = territories.find(t => t.id === territoryId);
    return territory ? territory.name : 'Unknown Territory';
  };

  const getCityName = (cityId) => {
    const city = cities.find(c => c.id === cityId);
    return city ? city.name : 'Unknown City';
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      arabic_name: branch.arabic_name || '',
      code: branch.code || '',
      country_id: branch.country_id || '',
      territory_id: branch.territory_id || '',
      city_id: branch.city_id || '',
      integration_key: branch.integration_key || '',
      is_active: branch.is_active !== undefined ? branch.is_active : true, // New field
      from_date: branch.from_date ? new Date(branch.from_date).toISOString().split('T')[0] : '', // Format date for input type="date"
      to_date: branch.to_date ? new Date(branch.to_date).toISOString().split('T')[0] : ''     // Format date for input type="date"
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      arabic_name: '',
      code: '',
      country_id: '',
      territory_id: '',
      city_id: '',
      integration_key: '',
      is_active: true, // Default to true for new entries
      from_date: '',
      to_date: ''
    });
    setFilteredTerritories([]);
    setFilteredCities([]);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      await Branch.delete(id);
      loadData();
    }
  };

  const handleToggleActive = async (branch) => {
    try {
      // Create a copy of the branch object and toggle the is_active status
      const updatedBranch = { ...branch, is_active: !branch.is_active };
      await Branch.update(branch.id, updatedBranch);
      loadData(); // Reload data to reflect the change in the UI
    } catch (error) {
      console.error("Error updating branch status:", error);
      alert("Failed to update branch status.");
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.country_id || !formData.territory_id || !formData.city_id) {
      alert('Name, Country, Territory, and City are required.');
      return;
    }
    
    const dataToSend = {
      name: formData.name,
      arabic_name: formData.arabic_name || '',
      code: formData.code || '',
      country_id: formData.country_id,
      territory_id: formData.territory_id,
      city_id: formData.city_id,
      integration_key: formData.integration_key || '',
      is_active: formData.is_active, // New field
      from_date: formData.from_date || null, // New field, use null if empty
      to_date: formData.to_date || null     // New field, use null if empty
    };
    
    if (editingBranch) {
      await Branch.update(editingBranch.id, dataToSend);
    } else {
      await Branch.create(dataToSend);
    }
    loadData();
    setIsDialogOpen(false);
    setEditingBranch(null);
    setFilteredTerritories([]);
    setFilteredCities([]);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingBranch(null);
    setFilteredTerritories([]);
    setFilteredCities([]);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Manage Branches</h1>
        <Button onClick={handleAddNew} className="clay-button">
          <Plus className="w-4 h-4 mr-2" />
          Add New Branch
        </Button>
      </div>

      <Card className="clay-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5 text-emerald-600" /> All Branches</CardTitle>
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
                  <TableHead>Territory</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Integration Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>From Date</TableHead>
                  <TableHead>To Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map(branch => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell className="font-arabic">{branch.arabic_name || '-'}</TableCell>
                    <TableCell>{getCountryName(branch.country_id)}</TableCell>
                    <TableCell>{getTerritoryName(branch.territory_id)}</TableCell>
                    <TableCell>{getCityName(branch.city_id)}</TableCell>
                    <TableCell><span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{branch.code || '-'}</span></TableCell>
                    <TableCell className="text-sm text-gray-600">{branch.integration_key || '-'}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleActive(branch)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors duration-200 ${
                          branch.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </TableCell>
                    <TableCell>{branch.from_date ? new Date(branch.from_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{branch.to_date ? new Date(branch.to_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(branch)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id)} className="text-red-500">
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

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="clay-card sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-6">
              <div>
                <Label>Country *</Label>
                <Select value={formData.country_id} onValueChange={(value) => handleInputChange('country_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country.id} value={country.id}>{country.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Territory *</Label>
                <Select 
                  value={formData.territory_id} 
                  onValueChange={(value) => handleInputChange('territory_id', value)}
                  disabled={!formData.country_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.country_id ? "Select Country first" : "Select Territory"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTerritories.map(territory => (
                      <SelectItem key={territory.id} value={territory.id}>{territory.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>City *</Label>
                <Select 
                  value={formData.city_id} 
                  onValueChange={(value) => handleInputChange('city_id', value)}
                  disabled={!formData.territory_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.territory_id ? "Select Territory first" : "Select City"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCities.map(city => (
                      <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>English Name *</Label>
                <Input
                  placeholder="Branch Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div>
                <Label>Arabic Name</Label>
                <Input
                  placeholder="اسم الفرع"
                  value={formData.arabic_name}
                  onChange={(e) => handleInputChange('arabic_name', e.target.value)}
                  className="text-right"
                  dir="rtl"
                />
              </div>
              <div>
                <Label>Branch Code</Label>
                <Input
                  placeholder="e.g., MAIN, DXB001"
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
              <input
                id="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <Label htmlFor="is_active">Is Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleDialogClose}>Cancel</Button>
            <Button onClick={handleSave} className="clay-button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
