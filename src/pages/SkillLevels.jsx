import React, { useState, useEffect } from 'react';
import { SkillLevel } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Award, Power, PowerOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export default function SkillLevelsPage() {
  const [skillLevels, setSkillLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSkillLevel, setEditingSkillLevel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    priority: 0,
    is_active: true
  });

  useEffect(() => {
    loadSkillLevels();
  }, []);

  const loadSkillLevels = async () => {
    setIsLoading(true);
    try {
      const items = await SkillLevel.list('-priority');
      setSkillLevels(items);
    } catch (error) {
      console.error("Error loading skill levels:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (skillLevel) => {
    setEditingSkillLevel(skillLevel);
    setFormData({
      name: skillLevel.name || '',
      display_name: skillLevel.display_name || '',
      description: skillLevel.description || '',
      priority: skillLevel.priority || 0,
      is_active: skillLevel.is_active !== undefined ? skillLevel.is_active : true
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingSkillLevel(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      priority: 0,
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this skill level?')) {
      try {
        await SkillLevel.delete(id);
        loadSkillLevels();
      } catch (error) {
        console.error("Error deleting skill level:", error);
        alert('Failed to delete skill level.');
      }
    }
  };

  const handleToggleActive = async (skillLevel) => {
    try {
      await SkillLevel.update(skillLevel.id, { ...skillLevel, is_active: !skillLevel.is_active });
      loadSkillLevels();
    } catch (error) {
      console.error("Error updating skill level status:", error);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.display_name) {
      alert('Name and Display Name are required.');
      return;
    }
    
    try {
      if (editingSkillLevel) {
        await SkillLevel.update(editingSkillLevel.id, formData);
      } else {
        await SkillLevel.create(formData);
      }
      loadSkillLevels();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving skill level:", error);
      alert('Failed to save skill level.');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Skill Levels</h1>
          <p className="text-sm text-gray-600">Manage skill levels for job profiles and personnel classification.</p>
        </div>
        <Button onClick={handleAddNew} className="clay-button bg-emerald-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add New Skill Level
        </Button>
      </div>

      <Card className="clay-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" /> 
            All Skill Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skillLevels.map(level => (
                  <TableRow key={level.id}>
                    <TableCell className="font-medium">{level.display_name}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {level.name}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {level.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{level.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={level.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {level.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleToggleActive(level)}>
                          {level.is_active ? 
                            <PowerOff className="w-4 h-4 text-orange-600" /> : 
                            <Power className="w-4 h-4 text-green-600" />
                          }
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(level)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(level.id)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {skillLevels.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No skill levels found. Add your first skill level to get started.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="clay-card max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSkillLevel ? 'Edit Skill Level' : 'Add New Skill Level'}
            </DialogTitle>
            <DialogDescription>
              {editingSkillLevel ? 'Update the skill level information below.' : 'Create a new skill level by filling in the details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Display Name *</Label>
              <Input
                placeholder="e.g., Advanced Level"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
              />
            </div>
            <div>
              <Label>System Name *</Label>
              <Input
                placeholder="e.g., advanced"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value.toLowerCase())}
                className="font-mono"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the requirements and expectations for this skill level..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label>Priority (Display Order)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500 mt-1">Higher numbers appear first</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="is_active" 
                checked={formData.is_active} 
                onCheckedChange={(checked) => handleInputChange('is_active', checked)} 
              />
              <Label htmlFor="is_active">Skill Level is Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="clay-button bg-emerald-500 text-white">
              Save Skill Level
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}