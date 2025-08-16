import React, { useState, useEffect, useMemo } from 'react';
import { CustomerInteraction } from '@/api/entities';
import { User } from '@/api/entities';
import { Account } from '@/api/entities';
import { Lead } from '@/api/entities';
import { CustomerResponseTemplate } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Filter,
  UserCheck,
  UserPlus,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import InteractionStats from '../components/staff/InteractionStats';
import StaffInteractionCard from '../components/staff/StaffInteractionCard';
import InteractionDetailDialog from '../components/staff/InteractionDetailDialog';

export default function StaffInteractionsPage() {
  const [interactions, setInteractions] = useState([]);
  const [data, setData] = useState({ users: [], accounts: [], leads: [], templates: [] });
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: 'all',
    priority: 'all',
    assignment: 'all'
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [
        user,
        interactionsData, 
        usersData, 
        accountsData, 
        leadsData, 
        templatesData
      ] = await Promise.all([
        User.me(),
        CustomerInteraction.list('-created_date', 100),
        User.list(),
        Account.list(),
        Lead.list(),
        CustomerResponseTemplate.list()
      ]);
      
      setCurrentUser(user);
      setInteractions(interactionsData || []);
      setData({
        users: usersData || [],
        accounts: accountsData || [],
        leads: leadsData || [],
        templates: templatesData || []
      });

    } catch (error) {
      console.error('Error loading staff interactions data:', error);
      // Set empty arrays as fallback
      setInteractions([]);
      setData({ users: [], accounts: [], leads: [], templates: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomerInfo = (interaction) => {
    if (interaction.account_id) {
      const account = data.accounts.find(a => a.id === interaction.account_id);
      return { type: 'account', name: account?.company_name || 'Unknown Account', data: account };
    }
    if (interaction.lead_id) {
      const lead = data.leads.find(l => l.id === interaction.lead_id);
      return { type: 'lead', name: lead?.company_name || 'Unknown Lead', data: lead };
    }
    const customer = data.users.find(u => u.id === interaction.customer_user_id);
    return { type: 'user', name: customer?.full_name || 'Unknown User', data: customer };
  };

  const handleAssignToMe = async (interaction) => {
    if (!currentUser) return;
    try {
      await CustomerInteraction.update(interaction.id, {
        assigned_to_employee_user_id: currentUser.id,
        assigned_to_employee_name: currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`,
        status: 'in_progress'
      });
      loadAllData();
    } catch (error) {
      console.error("Failed to assign interaction:", error);
    }
  };

  const handleUpdate = () => {
    setSelectedInteraction(null);
    loadAllData();
  };

  const filteredInteractions = useMemo(() => {
    return interactions.filter(interaction => {
      const customerInfo = getCustomerInfo(interaction);
      const searchTermLower = filters.searchTerm.toLowerCase();

      const matchesSearch = filters.searchTerm === '' ||
        interaction.subject?.toLowerCase().includes(searchTermLower) ||
        customerInfo.name?.toLowerCase().includes(searchTermLower) ||
        interaction.messages?.some(msg => msg.content?.toLowerCase().includes(searchTermLower));

      const matchesStatus = filters.status === 'all' || interaction.status === filters.status;
      const matchesPriority = filters.priority === 'all' || interaction.priority === filters.priority;
      
      const matchesAssignment = filters.assignment === 'all' ||
        (filters.assignment === 'me' && interaction.assigned_to_employee_user_id === currentUser?.id) ||
        (filters.assignment === 'unassigned' && !interaction.assigned_to_employee_user_id);
      
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignment;
    });
  }, [interactions, filters, currentUser, data]);

  const stats = useMemo(() => {
    return {
      assigned: interactions.filter(i => i.assigned_to_employee_user_id === currentUser?.id).length,
      unassigned: interactions.filter(i => !i.assigned_to_employee_user_id).length,
      escalated: interactions.filter(i => i.status === 'escalated').length,
      highPriority: interactions.filter(i => ['high', 'urgent'].includes(i.priority)).length,
    };
  }, [interactions, currentUser]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Customer Inbox</h1>
      
      <InteractionStats stats={stats} />
      
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by subject, customer, content..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="pl-10"
            />
          </div>
          <Select value={filters.assignment} onValueChange={(v) => setFilters(prev => ({ ...prev, assignment: v }))}>
            <SelectTrigger className="w-full md:w-48">
              <UserCheck className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Assignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="me">Assigned to Me</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="waiting_customer">Waiting</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.priority} onValueChange={(v) => setFilters(prev => ({ ...prev, priority: v }))}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))
        ) : (
          filteredInteractions.map(interaction => (
            <StaffInteractionCard
              key={interaction.id}
              interaction={interaction}
              customerInfo={getCustomerInfo(interaction)}
              currentUser={currentUser}
              onView={() => setSelectedInteraction(interaction)}
              onAssign={() => handleAssignToMe(interaction)}
            />
          ))
        )}
        
        {!isLoading && filteredInteractions.length === 0 && (
          <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow-sm">
            <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-30"/>
            <p className="text-lg font-medium">No interactions found</p>
            <p>Try adjusting your filters or check back later.</p>
          </div>
        )}
      </div>

      {selectedInteraction && (
        <InteractionDetailDialog
          isOpen={!!selectedInteraction}
          onClose={() => setSelectedInteraction(null)}
          interaction={selectedInteraction}
          customerInfo={getCustomerInfo(selectedInteraction)}
          currentUser={currentUser}
          templates={data.templates}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}