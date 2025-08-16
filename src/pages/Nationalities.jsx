
import React, { useState, useEffect } from 'react';
import { Nationality } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Power, PowerOff, Flag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import NationalityForm from '../components/pricing_setup/NationalityForm';
import { logAuditEvent } from '@/components/common/AuditService';

export default function NationalitiesPage() {
  const [nationalities, setNationalities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNationality, setEditingNationality] = useState(null);

  useEffect(() => {
    loadNationalities();
  }, []);

  const loadNationalities = async () => {
    setIsLoading(true);
    const data = await Nationality.list();
    setNationalities(data);
    setIsLoading(false);
  };
  
  const handleEdit = (nationality) => {
    setEditingNationality(nationality);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingNationality(null);
    setIsFormOpen(true);
  };
  
  const handleFormSave = () => {
    setIsFormOpen(false);
    setEditingNationality(null);
    loadNationalities();
  };

  const handleToggleActive = async (item) => {
    try {
      const newStatus = !item.is_active;
      await Nationality.update(item.id, { is_active: newStatus });
      await logAuditEvent({
        action: 'update',
        entityType: 'Nationality',
        entityId: item.id,
        entityName: item.name,
        oldValues: { is_active: item.is_active },
        newValues: { is_active: newStatus }
      });
      loadNationalities();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (id) => {
    const itemToDelete = nationalities.find(n => n.id === id);
    if (window.confirm('Are you sure you want to delete this nationality?')) {
      await Nationality.delete(id);
      await logAuditEvent({
        action: 'delete',
        entityType: 'Nationality',
        entityId: id,
        entityName: itemToDelete.name,
        oldValues: itemToDelete
      });
      loadNationalities();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nationalities</h1>
          <p className="text-sm text-gray-600">Manage nationalities and their default cost components.</p>
        </div>
        <Button onClick={handleAddNew} className="clay-button bg-emerald-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Nationality
        </Button>
      </div>
      
      <Card className="clay-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-emerald-600" />
            All Nationalities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Default Costs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nationalities.map(nat => (
                  <TableRow key={nat.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center">
                            {nat.iso_code ? (
                                <img
                                    src={`https://flagcdn.com/24x18/${nat.iso_code.toLowerCase()}.png`}
                                    alt={nat.name}
                                    className="w-6 h-5 object-contain rounded-sm"
                                />
                            ) : (
                                <Flag className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{nat.name}</div>
                            <div className="text-xs text-gray-500">{nat.arabic_name}</div>
                          </div>
                        </div>
                    </TableCell>
                    <TableCell>{nat.code}</TableCell>
                    <TableCell>{nat.default_cost_components?.length || 0}</TableCell>
                    <TableCell>
                      <Badge className={`${nat.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {nat.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleToggleActive(nat)}>
                                {nat.is_active ? <PowerOff className="w-4 h-4 text-orange-600" /> : <Power className="w-4 h-4 text-green-600" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(nat)}>
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(nat.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[80vw] lg:max-w-[1000px] clay-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNationality ? 'Edit Nationality' : 'Add New Nationality'}</DialogTitle>
            <DialogDescription>
              {editingNationality ? 'Update the details for this nationality.' : 'Define a new nationality and its defaults.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 pr-2">
            <NationalityForm
              nationality={editingNationality}
              onSave={handleFormSave}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
