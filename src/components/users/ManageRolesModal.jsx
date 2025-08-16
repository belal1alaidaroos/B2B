import React, { useState, useEffect } from 'react';
import { User as UserEntity } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ManageRolesModal({ user, isOpen, onClose, onRolesUpdated, availableRoles = [] }) {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user && user.roles) {
      setSelectedRoles(user.roles);
    }
  }, [user]);

  const handleRoleToggle = (roleId, isChecked) => {
    setSelectedRoles(prev => {
      const newRoles = isChecked
        ? [...new Set([...prev, roleId])]
        : prev.filter(r => r !== roleId);
      return newRoles;
    });
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await UserEntity.update(user.id, { roles: selectedRoles });
      onRolesUpdated();
      onClose();
    } catch (err) {
      console.error("Failed to update user roles:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] clay-card">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-bold text-gray-800">Manage User Roles</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            What roles would you like to apply to the 1 User you have selected?
          </p>
        </DialogHeader>
        
        <div className="border border-gray-200 rounded-lg">
          <div className="bg-gray-50 p-3 grid grid-cols-2 gap-4 text-sm font-medium text-gray-700">
            <div>Role Name</div>
            <div>Business Unit</div>
          </div>
          <ScrollArea className="h-72">
            <div className="divide-y divide-gray-100">
              {availableRoles.length > 0 ? (
                availableRoles.map((role) => (
                  <div key={role.id} className="grid grid-cols-2 gap-4 p-3 hover:bg-gray-50 items-center">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={(checked) => handleRoleToggle(role.id, checked)}
                        className="data-[state=checked]:bg-purple-600"
                      />
                      <label htmlFor={`role-${role.id}`} className="text-sm font-medium text-gray-800 cursor-pointer">
                        {role.display_name}
                      </label>
                    </div>
                    <div className="text-sm text-gray-600">
                      STAFFCRM
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-gray-500">No roles available.</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="pt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}