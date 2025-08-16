
import React, { useState, useEffect } from 'react';
import { CostComponent } from '@/api/entities';
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
import { Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import CostComponentForm from '../components/pricing_setup/CostComponentForm'; // New Import
import { logAuditEvent } from '@/components/common/AuditService';

export default function CostComponentsPage() {
  const [components, setComponents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    setIsLoading(true);
    const data = await CostComponent.list();
    setComponents(data);
    setIsLoading(false);
  };
  
  const handleEdit = (component) => {
    setEditingComponent(component);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingComponent(null);
    setIsFormOpen(true);
  };
  
  const handleFormSave = () => {
    setIsFormOpen(false);
    setEditingComponent(null);
    loadComponents();
  };

  const handleToggleActive = async (item) => {
    try {
      const newStatus = !item.is_active;
      // Optimistically update UI first, then persist change and log
      await CostComponent.update(item.id, { is_active: newStatus });
      await logAuditEvent({
        action: 'update',
        entityType: 'CostComponent',
        entityId: item.id,
        entityName: item.name,
        oldValues: { is_active: item.is_active },
        newValues: { is_active: newStatus }
      });
      loadComponents(); // Reload to ensure data consistency
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (id) => {
    const itemToDelete = components.find(c => c.id === id);
    if (window.confirm('Are you sure you want to delete this cost component?')) {
      try {
        await CostComponent.delete(id);
        await logAuditEvent({
          action: 'delete',
          entityType: 'CostComponent',
          entityId: id,
          entityName: itemToDelete?.name, // Use optional chaining in case itemToDelete is not found
          oldValues: itemToDelete
        });
        loadComponents();
      } catch (error) {
        console.error("Error deleting cost component:", error);
      }
    }
  };

  const formatValue = (component) => {
    if (component.calculation_method === 'percentage_of_base') {
      return `${component.value}%`;
    }
    return `$${component.value?.toFixed(2)}`;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cost Components</h1>
          <p className="text-sm text-gray-600">Manage individual cost items for the pricing engine.</p>
        </div>
        <Button onClick={handleAddNew} className="clay-button bg-emerald-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Component
        </Button>
      </div>
      
      <Card className="clay-card">
        <CardHeader>
          <CardTitle>All Cost Components</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Periodicity</TableHead>
                  <TableHead>Applicable For</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.map(component => (
                  <TableRow key={component.id}>
                    <TableCell>
                        <div className="font-medium">{component.name}</div>
                        <div className="text-xs text-gray-500">{component.code}</div>
                    </TableCell>
                    <TableCell>{component.type}</TableCell>
                    <TableCell>{formatValue(component)}</TableCell>
                    <TableCell>{component.periodicity}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {component.applicable_for?.map(app => (
                          <Badge key={app} variant="secondary">{app.replace('_', ' ')}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${component.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {component.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleToggleActive(component)}>
                                {component.is_active ? <PowerOff className="w-4 h-4 text-orange-600" /> : <Power className="w-4 h-4 text-green-600" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(component)}>
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(component.id)}>
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
        <DialogContent className="sm:max-w-[95vw] lg:max-w-[1400px] clay-card max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingComponent ? 'Edit Cost Component' : 'Add New Cost Component'}
            </DialogTitle>
            <DialogDescription>
              {editingComponent ? 'Update the details for this cost component.' : 'Define a new component for the pricing engine.'}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <CostComponentForm
              component={editingComponent}
              onSave={handleFormSave}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
