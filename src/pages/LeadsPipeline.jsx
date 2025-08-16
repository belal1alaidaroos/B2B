
import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Lead } from '@/api/entities';
import { Opportunity } from '@/api/entities'; // Import Opportunity
import { SystemSetting } from '@/api/entities'; // Import SystemSetting
import { Plus, Users } from 'lucide-react';
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

import PipelineColumn from '../components/pipeline/PipelineColumn';
import LeadCard from '../components/pipeline/LeadCard';
import PipelineToolbar from '../components/pipeline/PipelineToolbar';
import LeadForm from '../components/pipeline/LeadForm';
import OpportunityForm from '../components/opportunities/OpportunityForm'; // Import OpportunityForm

const pipelineStatuses = [
  { id: 'new', title: 'New' },
  { id: 'contacted', title: 'Contacted' },
  { id: 'qualified', title: 'Qualified' },
  { id: 'proposal_sent', title: 'Proposal Sent' },
  { id: 'negotiation', title: 'Negotiation' },
  { id: 'won', title: 'Won' }
];

export default function LeadsPipeline() {
  const [leads, setLeads] = useState([]);
  const [columns, setColumns] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isOpportunityFormOpen, setIsOpportunityFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadToConvert, setLeadToConvert] = useState(null);
  const [filters, setFilters] = useState({ searchTerm: '', priority: 'all', owner: 'all' });
  const [currency, setCurrency] = useState('AED'); // Add currency state
  const { canRead, canUpdate, canCreate, currentUser, isSuperAdmin } = usePermissions();

  useEffect(() => {
    if(currentUser) {
      loadLeads();
    }
  }, [currentUser]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      console.log('Loading leads. Is Super Admin:', isSuperAdmin());
      console.log('Current user:', currentUser);
      
      let query = {};
      
      // Only apply user-specific filter if NOT a super admin
      if (!isSuperAdmin()) {
        query = { 
          '$or': [
            { assigned_to: currentUser.id },
            { created_by: currentUser.email }
          ]
        };
        console.log('Applied user-specific query:', query);
      } else {
        console.log('Super admin - loading all leads');
      }
      
      const [allLeads, settingsData] = await Promise.all([
          Lead.filter(query, '-updated_date'),
          SystemSetting.list()
      ]);

      const currencySetting = settingsData.find(s => s.key === 'default_currency');
      if (currencySetting && currencySetting.value) {
        setCurrency(currencySetting.value);
      }

      console.log('Loaded leads count:', allLeads.length);
      setLeads(allLeads);
    } catch (error) {
      console.error("Error loading leads:", error);
      setLeads([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
        const searchTermLower = filters.searchTerm.toLowerCase();
        const matchesSearch = filters.searchTerm === '' ||
          lead.company_name?.toLowerCase().includes(searchTermLower) ||
          lead.contact_person?.toLowerCase().includes(searchTermLower);

        const matchesPriority = filters.priority === 'all' || lead.priority === filters.priority;
        
        const matchesOwner = filters.owner === 'all' ||
          (filters.owner === 'me' && (lead.assigned_to === currentUser?.id || lead.created_by === currentUser?.email));

        return matchesSearch && matchesPriority && matchesOwner;
      });
  }, [leads, filters, currentUser]);

  useEffect(() => {
    organizeLeadsIntoColumns(filteredLeads);
  }, [filteredLeads]);

  const organizeLeadsIntoColumns = (leadsToOrganize) => {
    const newColumns = pipelineStatuses.reduce((acc, status) => {
      acc[status.id] = {
        ...status,
        leads: leadsToOrganize.filter(lead => lead.status === status.id)
      };
      return acc;
    }, {});
    setColumns(newColumns);
  };

  const handleLeadFormSave = async (leadData) => {
    if (selectedLead) { // Editing existing lead
      await Lead.update(selectedLead.id, leadData);
      await logAuditEvent({
        action: 'update',
        entityType: 'Lead',
        entityId: selectedLead.id,
        entityName: leadData.company_name,
        oldValues: selectedLead,
        newValues: leadData,
      });
    } else { // Creating new lead
      const newLeadData = { ...leadData };
      if (!newLeadData.assigned_to && currentUser) {
        newLeadData.assigned_to = currentUser.id;
      }
      const newLead = await Lead.create(newLeadData);
      // Now, update it with the lead_number
      const leadNumber = `L-${newLead.id.slice(-6).toUpperCase()}`;
      await Lead.update(newLead.id, { lead_number: leadNumber });
      await logAuditEvent({
        action: 'create',
        entityType: 'Lead',
        entityId: newLead.id,
        entityName: newLeadData.company_name,
        newValues: { ...newLeadData, lead_number: leadNumber },
      });
    }
    setIsLeadFormOpen(false);
    setSelectedLead(null);
    loadLeads(); // Refresh data
  };

  const handleOpportunityFormSave = async (opportunityData) => {
    await Opportunity.create(opportunityData);
    if (leadToConvert) {
      // Mark lead as 'won' or a new 'converted' status
      await Lead.update(leadToConvert.id, { status: 'won' });
    }
    setIsOpportunityFormOpen(false);
    setLeadToConvert(null);
    loadLeads(); // Refresh leads to show updated status
  };

  const handleAddNewLead = () => {
    setSelectedLead(null);
    setIsLeadFormOpen(true);
  };

  const handleEditLead = (lead) => {
    setSelectedLead(lead);
    setIsLeadFormOpen(true);
  };

  const handleConvertToOpportunity = (lead) => {
    setLeadToConvert(lead);
    setIsOpportunityFormOpen(true);
  };

  const onDragEnd = async (result) => {
    if (!canUpdate('leads')) return;

    const { source, destination, draggableId } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const leadId = draggableId;
    const newStatus = destination.droppableId;

    // Optimistic UI update
    const leadToMove = leads.find(l => l.id === leadId);
    if (!leadToMove) {
        console.warn(`Lead with ID ${leadId} not found in current state.`);
        return;
    }
    const updatedLead = { ...leadToMove, status: newStatus };

    // Update local state immediately for responsiveness
    const newLeadsState = leads.map(l => (l.id === leadId ? updatedLead : l));
    setLeads(newLeadsState);

    try {
      await Lead.update(leadId, { status: newStatus });
      await logAuditEvent({
        action: 'update',
        entityType: 'Lead',
        entityId: leadId,
        entityName: leadToMove.company_name,
        oldValues: { status: leadToMove.status },
        newValues: { status: newStatus },
      });
    } catch (error) {
      console.error("Failed to update lead status:", error);
      // Revert UI on failure by restoring original leads state
      setLeads(leads);
    }
  };

  // Check if user can access this page
  if (!canRead('leads')) {
    return (
      <ProtectedComponent module="leads" action="read">
        <div>Access denied</div>
      </ProtectedComponent>
    );
  }

  return (
    <div className="p-4 space-y-4 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Leads Pipeline</h1>
          <p className="text-sm text-gray-600">Visualize and manage your sales funnel from start to finish.</p>
          {/* Debug info - remove in production */}
          <p className="text-xs text-blue-600 mt-1">
            Debug: Is Admin: {isSuperAdmin() ? 'Yes' : 'No'} | Leads Count: {leads.length} | User: {currentUser?.email}
          </p>
        </div>
        <ProtectedButton module="leads" action="create">
          <Button onClick={handleAddNewLead} className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:scale-105 transition-transform duration-200">
            <Plus className="w-4 h-4 mr-2" />
            Add New Lead
          </Button>
        </ProtectedButton>
      </div>

      <PipelineToolbar onFiltersChange={setFilters} />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {isLoading ? (
            pipelineStatuses.map(status => (
              <div key={status.id}>
                <h3 className="font-semibold text-lg text-gray-700 mb-4 px-2">{status.title}</h3>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                </div>
              </div>
            ))
          ) : (
            pipelineStatuses.map(statusInfo => (
              <PipelineColumn key={statusInfo.id} column={columns[statusInfo.id] || statusInfo}>
                {(columns[statusInfo.id]?.leads || []).map((lead, index) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    index={index}
                    onEdit={handleEditLead}
                    onConvertToOpportunity={handleConvertToOpportunity}
                    currency={currency}
                  />
                ))}
              </PipelineColumn>
            ))
          )}
        </div>
      </DragDropContext>

      <Dialog open={isLeadFormOpen} onOpenChange={setIsLeadFormOpen}>
        <DialogContent className="clay-card sm:max-w-6xl lg:max-w-7xl xl:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>{selectedLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
            <DialogDescription>
              {selectedLead ? 'Update the details for this lead.' : 'Fill in the details for the new lead.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[80vh] overflow-y-auto px-2">
            <LeadForm
              lead={selectedLead}
              onSave={handleLeadFormSave}
              onCancel={() => setIsLeadFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpportunityFormOpen} onOpenChange={setIsOpportunityFormOpen}>
        <DialogContent className="clay-card sm:max-w-6xl lg:max-w-7xl xl:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Convert Lead to Opportunity</DialogTitle>
            <DialogDescription>
              Create a new opportunity based on this lead's information.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[80vh] overflow-y-auto px-2">
            <OpportunityForm
              lead={leadToConvert}
              onSave={handleOpportunityFormSave}
              onCancel={() => setIsOpportunityFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
