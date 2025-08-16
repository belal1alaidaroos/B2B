
import React, { useState, useEffect, useMemo } from 'react';
import { Contact } from '@/api/entities';
import { Account } from '@/api/entities';
import { User, Plus } from 'lucide-react';
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


import ContactList from '../components/contacts/ContactList';
import ContactToolbar from '../components/contacts/ContactToolbar';
import ContactStats from '../components/contacts/ContactStats';
import ContactForm from '../components/contacts/ContactForm';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [filters, setFilters] = useState({ searchTerm: '', status: 'all', authority: 'all' });
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
      // For contacts, we will also assume non-admins can see all contacts for now.
      // This is because a contact may be relevant to multiple salespeople.
      // if (!isSuperAdmin()) {
      //   query = { created_by: currentUser.email };
      // }
      
      const [contactsData, accountsData] = await Promise.all([
        Contact.filter(query, '-updated_date'),
        Account.list()
      ]);
      setContacts(contactsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const accountName = accounts.find(acc => acc.id === contact.account_id)?.company_name || '';

      const matchesSearch = filters.searchTerm === '' ||
        contact.first_name?.toLowerCase().includes(searchTermLower) ||
        contact.last_name?.toLowerCase().includes(searchTermLower) ||
        contact.email?.toLowerCase().includes(searchTermLower) ||
        accountName.toLowerCase().includes(searchTermLower);
      
      const matchesStatus = filters.status === 'all' || contact.status === filters.status;
      const matchesAuthority = filters.authority === 'all' || contact.authority_level === filters.authority;

      return matchesSearch && matchesStatus && matchesAuthority;
    });
  }, [contacts, accounts, filters]);
  
  const handleFormSave = async (contactData) => {
    if (selectedContact) {
      // Store old values before update for audit logging
      const oldContactData = { ...selectedContact }; 
      await Contact.update(selectedContact.id, contactData);
      await logAuditEvent({
        action: 'update',
        entityType: 'Contact',
        entityId: selectedContact.id,
        entityName: `${contactData.first_name} ${contactData.last_name}`,
        oldValues: oldContactData, // Pass the original selectedContact
        newValues: contactData,
      });
    } else {
      const newContact = await Contact.create(contactData);
      await logAuditEvent({
        action: 'create',
        entityType: 'Contact',
        entityId: newContact.id,
        entityName: `${newContact.first_name} ${newContact.last_name}`, // Use newContact for name if available
        newValues: newContact, // Pass the newly created contact data
      });
    }
    setIsFormOpen(false);
    setSelectedContact(null);
    loadData();
  };

  const handleAddNew = () => {
    if (!canCreate('contacts')) return;
    setSelectedContact(null);
    setIsFormOpen(true);
  };
  
  const handleEdit = (contact) => {
    if (!canUpdate('contacts')) return;
    setSelectedContact(contact);
    setIsFormOpen(true);
  };

  const getContactStats = () => {
    const totalContacts = filteredContacts.length || 0; // Use filteredContacts for stats
    const decisionMakers = filteredContacts.filter(contact => contact.decision_maker).length;
    const activeContacts = filteredContacts.filter(contact => contact.status === 'active').length;
    const recentContacts = filteredContacts.filter(contact => {
      if (!contact.last_contact_date) return false;
      const lastContact = new Date(contact.last_contact_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastContact >= thirtyDaysAgo;
    }).length;

    return {
      totalContacts,
      decisionMakers,
      activeContacts,
      recentContacts
    };
  };

  const stats = getContactStats();
  
  if (!canRead('contacts')) {
    return (
      <ProtectedComponent module="contacts" action="read">
        <div className="flex items-center justify-center h-screen text-xl text-gray-600">Access denied to Contacts</div>
      </ProtectedComponent>
    );
  }

  return (
    <div className="p-4 space-y-3 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contact Management</h1>
          <p className="text-sm text-gray-600">Manage all your business contacts and relationships.</p>
        </div>
        <ProtectedButton module="contacts" action="create">
          <Button onClick={handleAddNew} className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:scale-105 transition-transform duration-200 px-3 py-1.5 h-auto text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add New Contact
          </Button>
        </ProtectedButton>
      </div>

      <ContactStats stats={stats} isLoading={isLoading} />

      <div className="clay-card p-2">
        <ContactToolbar 
          viewMode={viewMode} 
          onViewModeChange={setViewMode}
          onFiltersChange={setFilters} 
        />
        {isLoading ? (
          <div className="p-2">
            {Array(8).fill(0).map((_, i) => (
               <Skeleton key={i} className="h-10 w-full mb-1.5 rounded-lg" />
            ))}
          </div>
        ) : (
          <ContactList 
            contacts={filteredContacts} 
            accounts={accounts} 
            viewMode={viewMode}
            onEdit={handleEdit}
          />
        )}
      </div>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl clay-card">
          <DialogHeader>
            <DialogTitle>{selectedContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
            <DialogDescription>
              {selectedContact ? 'Update the details for this contact.' : 'Fill in the details for the new contact.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[80vh] overflow-y-auto px-2">
            <ContactForm
              contact={selectedContact}
              accounts={accounts}
              onSave={handleFormSave}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
