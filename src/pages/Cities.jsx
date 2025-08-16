
import React, { useState, useEffect } from 'react';
import { City } from '@/api/entities';
import { Country } from '@/api/entities';
import { Territory } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Building2, Power, PowerOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export default function CitiesPage() {
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [filteredTerritories, setFilteredTerritories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    arabic_name: '',
    code: '',
    country_id: '',
    territory_id: '',
    integration_key: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  // Handle country selection change to filter territories
  useEffect(() => {
    if (formData.country_id) {
      const filtered = territories.filter(t => t.country_id === formData.country_id);
      setFilteredTerritories(filtered);
      
      // Reset territory selection if current selection is not valid for the new country
      if (formData.territory_id && !filtered.find(t => t.id === formData.territory_id)) {
        setFormData(prev => ({ ...prev, territory_id: '' }));
      }
    } else {
      setFilteredTerritories([]);
      setFormData(prev => ({ ...prev, territory_id: '' }));
    }
  }, [formData.country_id, territories]);

  // When dialog opens with existing data, ensure filtered territories are set correctly
  useEffect(() => {
    if (isDialogOpen && editingCity && editingCity.country_id && territories.length > 0) {
      const filtered = territories.filter(t => t.country_id === editingCity.country_id);
      setFilteredTerritories(filtered);
    }
  }, [isDialogOpen, editingCity, territories]);

  // Reset editingCity and filteredTerritories when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingCity(null);
      setFilteredTerritories([]);
    }
  }, [isDialogOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [citiesData, countriesData, territoriesData] = await Promise.all([
        City.list(),
        Country.list(),
        Territory.list()
      ]);
      setCities(citiesData);
      setCountries(countriesData);
      setTerritories(territoriesData);
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

  const handleEdit = (city) => {
    setEditingCity(city);
    setFormData({
      name: city.name || '',
      arabic_name: city.arabic_name || '',
      code: city.code || '',
      country_id: city.country_id || '',
      territory_id: city.territory_id || '',
      integration_key: city.integration_key || '',
      is_active: city.is_active !== undefined ? city.is_active : true
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingCity(null);
    setFormData({
      name: '',
      arabic_name: '',
      code: '',
      country_id: '',
      territory_id: '',
      integration_key: '',
      is_active: true
    });
    setFilteredTerritories([]); // Ensure filtered territories are cleared for new entry
    setIsDialogOpen(true);
  };
  
  const handleToggleActive = async (city) => {
    try {
      await City.update(city.id, { ...city, is_active: !city.is_active });
      loadData();
    } catch (error) {
      console.error("Error updating city status:", error);
      alert('Failed to update city status.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this city?')) {
      await City.delete(id);
      loadData();
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.country_id || !formData.territory_id) {
      alert('Name, Country, and Territory are required.');
      return;
    }
    
    const dataToSend = {
      name: formData.name,
      arabic_name: formData.arabic_name || '',
      code: formData.code || '',
      country_id: formData.country_id,
      territory_id: formData.territory_id,
      integration_key: formData.integration_key || '',
      is_active: formData.is_active,
    };
    
    try {
      if (editingCity) {
        await City.update(editingCity.id, dataToSend);
      } else {
        await City.create(dataToSend);
      }
      loadData();
      setIsDialogOpen(false);
      // formData is implicitly reset by handleAddNew/handleEdit on next open
      // editingCity and filteredTerritories are reset by useEffect on dialog close
    } catch (error) {
      console.error("Error saving city:", error);
      alert('Failed to save city.');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Manage Cities</h1>
        <Button onClick={handleAddNew} className="clay-button">
          <Plus className="w-4 h-4 mr-2" />
          Add New City
        </Button>
      </div>

      <Card className="clay-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-emerald-600" /> All Cities</CardTitle>
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.map(city => (
                  <TableRow key={city.id}>
                    <TableCell className="font-medium">{city.name}</TableCell>
                    <TableCell className="font-arabic">{city.arabic_name || '-'}</TableCell>
                    <TableCell>{getCountryName(city.country_id)}</TableCell>
                    <TableCell>{getTerritoryName(city.territory_id)}</TableCell>
                    <TableCell>
                        <Badge className={`${city.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {city.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleToggleActive(city)} title={city.is_active ? "Deactivate" : "Activate"}>
                        {city.is_active ? <PowerOff className="w-4 h-4 text-orange-500" /> : <Power className="w-4 h-4 text-green-500" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(city)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(city.id)} className="text-red-500">
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
            <DialogTitle>{editingCity ? 'Edit City' : 'Add New City'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6">
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
              <div>
                <Label htmlFor="territory_id">Territory *</Label>
                <Select 
                  value={formData.territory_id} 
                  onValueChange={(value) => handleInputChange('territory_id', value)}
                  disabled={!formData.country_id}
                >
                  <SelectTrigger id="territory_id">
                    <SelectValue placeholder={!formData.country_id ? "Select Country first" : "Select Territory"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTerritories.map(territory => (
                      <SelectItem key={territory.id} value={territory.id}>{territory.name}</SelectItem>
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
                  placeholder="City Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="arabic_name">Arabic Name</Label>
                <Input
                  id="arabic_name"
                  placeholder="اسم المدينة"
                  value={formData.arabic_name}
                  onChange={(e) => handleInputChange('arabic_name', e.target.value)}
                  className="text-right"
                  dir="rtl"
                />
              </div>
              <div>
                <Label htmlFor="code">City Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., DXB, AUH"
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
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">City is Active</Label>
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
