
import React, { useState, useEffect, useMemo } from 'react';
import { Account } from '@/api/entities';
import { Contact } from '@/api/entities';
import { SystemSetting } from '@/api/entities';
import { Building2, Plus, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/components/hooks/usePermissions';
import ProtectedComponent, { ProtectedButton } from '@/components/common/ProtectedComponent';
import { logAuditEvent } from '@/components/common/AuditService'; // Import the audit service
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import AccountList from '../components/accounts/AccountList';
import AccountToolbar from '../components/accounts/AccountToolbar';
import AccountStats from '../components/accounts/AccountStats';
import AccountForm from '../components/accounts/AccountForm';

// Module-level cache for system settings
let settingsCache = null;

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [currency, setCurrency] = useState('AED');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [filters, setFilters] = useState({ searchTerm: '', status: 'all', industry: 'all' });
  const { canRead, canCreate, canUpdate, currentUser, isSuperAdmin } = usePermissions();

  useEffect(() => {
    if(currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let query = {};
      // For accounts, we will assume non-admins can see all accounts for now,
      // as they are central to the business. This can be changed if needed.
      // if (!isSuperAdmin()) {
      //   query = { created_by: currentUser.email };
      // }
      const [accountsData, contactsData, settingsDataResult] = await Promise.all([
        Account.filter(query, '-updated_date'),
        Contact.list(),
        settingsCache ? Promise.resolve(settingsCache) : SystemSetting.list(), // Fetch settings only if not cached
      ]);

      if (!settingsCache) {
        settingsCache = settingsDataResult; // Cache the settings
      }
      const settingsData = settingsCache; // Ensure we always use the cached version if available

      setAccounts(accountsData);
      setContacts(contactsData);

      const currencySetting = settingsData.find(s => s.key === 'default_currency');
      if (currencySetting && currencySetting.value) {
        setCurrency(currencySetting.value);
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFormSave = async (accountData) => {
    try {
      if (selectedAccount) {
        await Account.update(selectedAccount.id, accountData);
        await logAuditEvent({
          action: 'update',
          entityType: 'Account',
          entityId: selectedAccount.id,
          entityName: accountData.company_name,
          oldValues: selectedAccount,
          newValues: accountData,
        });
      } else {
        const newAccount = await Account.create(accountData);
        await logAuditEvent({
          action: 'create',
          entityType: 'Account',
          entityId: newAccount.id,
          entityName: accountData.company_name,
          newValues: accountData,
        });
      }
      setIsFormOpen(false);
      setSelectedAccount(null);
      loadData();
    } catch (error) {
      console.error("Error saving account:", error);
      // Optionally, show a toast notification to the user
    }
  };

  const handleAddNew = () => {
    if (!canCreate('accounts')) {
      console.warn("Permission denied: Cannot create accounts.");
      // Optionally, show a toast notification
      return;
    }
    setSelectedAccount(null);
    setIsFormOpen(true);
  };
  
  const handleEdit = (account) => {
    if (!canUpdate('accounts')) {
      console.warn("Permission denied: Cannot update accounts.");
      // Optionally, show a toast notification
      return;
    }
    setSelectedAccount(account);
    setIsFormOpen(true);
  };

  const getAccountStats = () => {
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter(acc => acc.account_status === 'active').length;
    const totalRevenue = accounts.reduce((sum, acc) => sum + (acc.annual_revenue || 0), 0);
    const averageRevenue = totalAccounts > 0 ? totalRevenue / totalAccounts : 0;

    return {
      totalAccounts,
      activeAccounts,
      totalRevenue,
      averageRevenue
    };
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const matchesSearch = filters.searchTerm === '' ||
        acc.company_name?.toLowerCase().includes(searchTermLower) ||
        acc.trading_name?.toLowerCase().includes(searchTermLower);
      
      const matchesStatus = filters.status === 'all' || acc.account_status === filters.status;
      const matchesIndustry = filters.industry === 'all' || acc.industry === filters.industry;

      return matchesSearch && matchesStatus && matchesIndustry;
    });
  }, [accounts, filters]);


  // Check if user can access this page
  if (!canRead('accounts')) {
    return (
      <ProtectedComponent module="accounts" action="read">
        <div className="flex items-center justify-center h-screen text-xl text-gray-600">Access denied to Accounts</div>
      </ProtectedComponent>
    );
  }

  const stats = getAccountStats();

  return (
    <div className="p-4 space-y-3 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Account Management</h1>
          <p className="text-sm text-gray-600">Manage your client companies and business relationships.</p>
        </div>
        <ProtectedButton module="accounts" action="create">
          <Button onClick={handleAddNew} className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:scale-105 transition-transform duration-200 px-3 py-1.5 h-auto text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add New Account
          </Button>
        </ProtectedButton>
      </div>

      <AccountStats stats={stats} isLoading={isLoading} currency={currency} />

      <div className="clay-card p-2">
        <AccountToolbar 
          viewMode={viewMode} 
          onViewModeChange={setViewMode} 
          onFiltersChange={setFilters}
        />
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-2">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="clay-element p-3 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <AccountList 
            accounts={filteredAccounts}
            contacts={contacts} 
            viewMode={viewMode}
            onEdit={handleEdit}
          />
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl clay-card">
          <DialogHeader>
            <DialogTitle>{selectedAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
            <DialogDescription>
              {selectedAccount ? 'Update the details for this account.' : 'Fill in the details for the new account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[80vh] overflow-y-auto px-2">
            <AccountForm
              account={selectedAccount}
              onSave={handleFormSave}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
