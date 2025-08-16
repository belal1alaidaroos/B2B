
import React, { useState, useEffect, useMemo } from 'react';
import { Contract } from '@/api/entities';
import { Account } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { usePermissions } from '@/components/hooks/usePermissions';
import ProtectedComponent, { ProtectedButton } from '@/components/common/ProtectedComponent';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { logAuditEvent } from '@/components/common/AuditService'; // Import the audit service

import ContractStats from '../components/contracts/ContractStats';
import ContractList from '../components/contracts/ContractList';
import ContractForm from '../components/contracts/ContractForm';

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const { canRead } = usePermissions();

  useEffect(() => {
    if (canRead('contracts')) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [canRead]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [contractsData, accountsData] = await Promise.all([
        Contract.list('-created_date'),
        Account.list()
      ]);
      setContracts(contractsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error loading contracts data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (contractData, isEditing = false) => {
    try {
      if (isEditing && editingContract) {
        await Contract.update(editingContract.id, contractData);
        await logAuditEvent({
          action: 'update',
          entityType: 'Contract',
          entityId: editingContract.id,
          entityName: contractData.title || contractData.contract_number,
          oldValues: editingContract,
          newValues: contractData,
        });
      } else {
        const newContract = await Contract.create(contractData);
        await logAuditEvent({
          action: 'create',
          entityType: 'Contract',
          entityId: newContract.id,
          entityName: contractData.title || contractData.contract_number,
          newValues: contractData,
        });
      }
      
      loadData();
      setIsFormOpen(false);
      setEditingContract(null);
    } catch (error) {
      console.error("Failed to save contract:", error);
      alert('Failed to save contract. Please try again.');
    }
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setIsFormOpen(true);
  };

  const handleDelete = async (contractId) => {
    if (window.confirm('Are you sure you want to delete this contract? This action cannot be undone.')) {
      try {
        // Get contract details before deletion for audit log
        const contractToDelete = contracts.find(c => c.id === contractId);
        
        await Contract.delete(contractId);
        
        // Log the deletion
        await logAuditEvent({
          action: 'delete',
          entityType: 'Contract',
          entityId: contractId,
          entityName: contractToDelete?.title || contractToDelete?.contract_number || `Contract ${contractId}`,
          oldValues: contractToDelete,
          newValues: {},
        });
        
        loadData();
      } catch (error) {
        console.error("Failed to delete contract:", error);
        
        // Log the failed deletion attempt
        await logAuditEvent({
          action: 'delete',
          entityType: 'Contract',
          entityId: contractId,
          entityName: `Contract ${contractId}`,
          success: false,
          errorMessage: error.message,
        });
        
        alert('Failed to delete contract. Please try again.');
      }
    }
  };

  if (!canRead('contracts')) {
    return <ProtectedComponent module="contracts" />;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contract Management</h1>
          <p className="text-sm text-gray-600">Track and manage all your active and upcoming contracts.</p>
        </div>
        <div className="flex gap-2">
          <ProtectedButton module="contracts" action="export">
            <Button variant="outline" className="clay-button">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </ProtectedButton>
          <ProtectedButton module="contracts" action="create">
            <Button onClick={() => { setEditingContract(null); setIsFormOpen(true); }} className="clay-button bg-emerald-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Contract
            </Button>
          </ProtectedButton>
        </div>
      </div>

      <ContractStats contracts={contracts} isLoading={isLoading} />

      <div className="clay-card p-2">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
          </div>
        ) : (
          <ContractList 
            contracts={contracts} 
            accounts={accounts} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] clay-card">
          <DialogHeader>
            <DialogTitle>{editingContract ? 'Edit Contract' : 'Create New Contract'}</DialogTitle>
          </DialogHeader>
          <ContractForm 
            contract={editingContract}
            accounts={accounts}
            onSuccess={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
