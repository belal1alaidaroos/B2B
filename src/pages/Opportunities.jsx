
import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Opportunity } from '@/api/entities';
import { Lead } from '@/api/entities';
import { Account } from '@/api/entities';
import { SystemSetting } from '@/api/entities'; // Import SystemSetting
import { Button } from '@/components/ui/button';
import { Plus, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePermissions } from '@/components/hooks/usePermissions';
import ProtectedComponent from '@/components/common/ProtectedComponent';

import OpportunityCard from '../components/opportunities/OpportunityCard';
import OpportunityForm from '../components/opportunities/OpportunityForm';
import OpportunityColumn from '../components/opportunities/OpportunityColumn';
import OpportunityToolbar from '../components/opportunities/OpportunityToolbar';

// Module-level cache for system settings
let settingsCache = null;

const pipelineStages = [
  { id: 'qualification', title: 'Qualification' },
  { id: 'needs_analysis', title: 'Needs Analysis' },
  { id: 'proposal', title: 'Proposal' },
  { id: 'negotiation', title: 'Negotiation' },
  { id: 'closed_won', title: 'Closed Won' },
  { id: 'closed_lost', title: 'Closed Lost' },
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [leads, setLeads] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [currency, setCurrency] = useState('AED'); // Add currency state
  const [columns, setColumns] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [filters, setFilters] = useState({ searchTerm: '', stage: 'all', owner: 'all' });
  const { canRead, canUpdate, canCreate, currentUser, isSuperAdmin } = usePermissions();

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading opportunities. Is Super Admin:', isSuperAdmin());
      console.log('Current user:', currentUser);
      
      let query = {};
      
      // Only apply user-specific filter if NOT a super admin
      if (!isSuperAdmin()) {
        query = {
          '$or': [
            { owner_id: currentUser.id },
            { created_by: currentUser.email }
          ]
        };
        console.log('Applied user-specific query for opportunities:', query);
      } else {
        console.log('Super admin - loading all opportunities');
      }

      const [oppsData, leadsData, accountsData, settingsDataResult] = await Promise.all([
        Opportunity.filter(query, '-updated_date'),
        Lead.list(),
        Account.list(),
        settingsCache ? Promise.resolve(settingsCache) : SystemSetting.list(), // Fetch settings only if not cached
      ]);

      if (!settingsCache) {
        settingsCache = settingsDataResult; // Cache the settings
      }
      const settingsData = settingsCache; // Always refer to the cached data

      const currencySetting = settingsData.find(s => s.key === 'default_currency');
      if (currencySetting && currencySetting.value) {
        setCurrency(currencySetting.value);
      }

      console.log('Loaded opportunities count:', oppsData.length);

      const accountsMap = accountsData.reduce((map, acc) => {
        map[acc.id] = acc;
        return map;
      }, {});

      const opportunitiesWithAccounts = oppsData.map(opp => ({
        ...opp,
        account: accountsMap[opp.account_id]
      }));

      setOpportunities(opportunitiesWithAccounts);
      setLeads(leadsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error loading opportunities data:", error);
      setOpportunities([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const matchesSearch = filters.searchTerm === '' ||
        opp.name?.toLowerCase().includes(searchTermLower) ||
        opp.opportunity_number?.toLowerCase().includes(searchTermLower);

      const matchesStage = filters.stage === 'all' || opp.stage === filters.stage;

      const matchesOwner = filters.owner === 'all' ||
        (filters.owner === 'me' && (opp.owner_id === currentUser?.id || opp.created_by === currentUser?.email));

      return matchesSearch && matchesStage && matchesOwner;
    });
  }, [opportunities, filters, currentUser]);

  useEffect(() => {
    organizeOpportunitiesIntoColumns(filteredOpportunities);
  }, [filteredOpportunities]);

  const organizeOpportunitiesIntoColumns = (data) => {
    const newColumns = pipelineStages.reduce((acc, stage) => {
      acc[stage.id] = {
        ...stage,
        items: data.filter(item => item.stage === stage.id)
      };
      return acc;
    }, {});
    setColumns(newColumns);
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const oppId = draggableId;
    const newStage = destination.droppableId;

    // Optimistic UI update
    const oppToMove = opportunities.find(o => o.id === oppId);
    if (!oppToMove) return;

    const updatedOpp = { ...oppToMove, stage: newStage };
    const newOpps = opportunities.map(o => o.id === oppId ? updatedOpp : o);
    setOpportunities(newOpps);

    try {
      await Opportunity.update(oppId, { stage: newStage });
    } catch (error) {
      console.error("Failed to update opportunity stage:", error);
      // Revert on failure by re-loading data
      loadData();
    }
  };

  const handleFormSave = async (oppData) => {
    const dataToSave = { ...oppData };

    // Assign to current user if not set for new opportunities
    if (!selectedOpportunity && !dataToSave.owner_id && currentUser) {
      dataToSave.owner_id = currentUser.id;
    }

    if (selectedOpportunity) {
      await Opportunity.update(selectedOpportunity.id, dataToSave);
    } else {
      const newOpp = await Opportunity.create(dataToSave);
      // Now, update it with the opportunity_number
      const oppNumber = `OPP-${newOpp.id.slice(-6).toUpperCase()}`;
      await Opportunity.update(newOpp.id, { opportunity_number: oppNumber });
    }
    setIsFormOpen(false);
    setSelectedOpportunity(null);
    loadData();
  };

  const handleCreateNew = () => {
    setSelectedOpportunity(null);
    setIsFormOpen(true);
  };

  const handleEdit = (opp) => {
    setSelectedOpportunity(opp);
    setIsFormOpen(true);
  };

  return (
    <div className="p-4 space-y-4 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            Opportunities Pipeline
          </h1>
          <p className="text-sm text-gray-600 mt-1 ml-1">Track your high-value deals from qualification to close.</p>
          {/* Debug info - remove in production */}
          <p className="text-xs text-blue-600 mt-1">
            Debug: Is Admin: {isSuperAdmin() ? 'Yes' : 'No'} | Opportunities Count: {opportunities.length} | User: {currentUser?.email}
          </p>
        </div>
        <ProtectedComponent module="opportunities" action="create">
          <Button onClick={handleCreateNew} className="clay-button bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:scale-105 transition-transform duration-200">
            <Plus className="w-4 h-4 mr-2" />
            Create Opportunity
          </Button>
        </ProtectedComponent>
      </div>

      <OpportunityToolbar onFiltersChange={setFilters} />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          {isLoading ? (
            pipelineStages.map(stage => (
              <div key={stage.id}>
                <div className="flex items-center gap-2 mb-4 px-2">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-4 bg-gray-100/40 p-4 rounded-xl">
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-40 w-full rounded-xl" />
                </div>
              </div>
            ))
          ) : (
            pipelineStages.map(stageInfo => (
              <OpportunityColumn key={stageInfo.id} stage={columns[stageInfo.id] || { ...stageInfo, items: [] }}>
                {(columns[stageInfo.id]?.items || []).map((opp, index) => (
                  <OpportunityCard key={opp.id} opportunity={opp} index={index} onEdit={handleEdit} currency={currency} />
                ))}
              </OpportunityColumn>
            ))
          )}
        </div>
      </DragDropContext>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="clay-card sm:max-w-6xl lg:max-w-7xl xl:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>{selectedOpportunity ? 'Edit Opportunity' : 'Create Opportunity'}</DialogTitle>
            <DialogDescription>
              {selectedOpportunity ? 'Update the details for this deal.' : 'Fill in the details for the new deal.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[80vh] overflow-y-auto px-2">
            <OpportunityForm
              opportunity={selectedOpportunity}
              onSave={handleFormSave}
              onCancel={() => setIsFormOpen(false)}
              accounts={accounts}
              leads={leads}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
