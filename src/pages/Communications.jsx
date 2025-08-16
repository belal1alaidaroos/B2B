
import React, { useState, useEffect } from "react";
import { Communication } from "@/api/entities";
import { Lead } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, Plus, Search, Filter, Mail, Phone, Calendar, 
  ArrowUpRight, ArrowDownLeft, Eye, Edit, Trash2
} from "lucide-react";
import { format } from "date-fns";
import { logAuditEvent } from '@/components/common/AuditService'; // Import the audit service

import CommunicationLogForm from "../components/communications/CommunicationLogForm";

const getTypeIcon = (type) => {
  const icons = {
    email: Mail,
    phone: Phone, 
    meeting: Calendar,
    whatsapp: MessageSquare,
    sms: MessageSquare,
    note: MessageSquare
  };
  return icons[type] || MessageSquare;
};

const getStatusColor = (status) => {
  const colors = {
    sent: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    read: 'bg-emerald-100 text-emerald-800',
    replied: 'bg-teal-100 text-teal-800',
    failed: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export default function CommunicationsPage() {
  const [communications, setCommunications] = useState([]);
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [commData, leadsData] = await Promise.all([
        Communication.list('-created_date', 50),
        Lead.list()
      ]);
      setCommunications(commData);
      setLeads(leadsData);
    } catch (error) {
      console.error("Error loading communications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommunicationCreated = (newCommunication) => {
    // Log the creation of new communication
    logAuditEvent({
      action: 'create',
      entityType: 'Communication',
      entityId: newCommunication.id,
      entityName: newCommunication.subject || `${newCommunication.type} communication`,
      newValues: newCommunication,
    });
    
    setShowForm(false);
    loadData();
  };

  const getLeadInfo = (leadId) => {
    return leads.find(lead => lead.id === leadId);
  };

  const filteredCommunications = communications.filter(comm => {
    const lead = getLeadInfo(comm.lead_id);
    const matchesSearch = searchTerm === '' || 
      comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || comm.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || comm.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStats = () => {
    return {
      total: communications.length,
      today: communications.filter(c => {
        const today = new Date().toDateString();
        return new Date(c.created_date).toDateString() === today;
      }).length,
      emails: communications.filter(c => c.type === 'email').length,
      calls: communications.filter(c => c.type === 'phone').length
    };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Communications</h1>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Communication
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Communications</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Today</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Emails</p>
                <p className="text-2xl font-bold">{stats.emails}</p>
              </div>
              <Mail className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Phone Calls</p>
                <p className="text-2xl font-bold">{stats.calls}</p>
              </div>
              <Phone className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search communications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="note">Note</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Communications List */}
      <div className="space-y-4">
        {filteredCommunications.length > 0 ? (
          filteredCommunications.map((comm) => {
            const lead = getLeadInfo(comm.lead_id);
            const TypeIcon = getTypeIcon(comm.type);
            
            return (
              <Card key={comm.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TypeIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1">
                        {comm.direction === 'outbound' ? (
                          <ArrowUpRight className="w-4 h-4 text-blue-600 bg-white rounded-full p-0.5" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4 text-green-600 bg-white rounded-full p-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800 truncate">
                            {comm.subject || `${comm.type.charAt(0).toUpperCase() + comm.type.slice(1)} with ${lead?.company_name || 'Unknown'}`}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <span>{lead?.company_name || 'Unknown Company'}</span>
                            <span>•</span>
                            <span>{comm.contact_person || 'Unknown Contact'}</span>
                            <span>•</span>
                            <span>{format(new Date(comm.created_date), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(comm.status)} border-none`}>
                            {comm.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                        {comm.content}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 px-3">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-3">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Communications Found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Start logging your client interactions to see them here.'
                }
              </p>
              {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
                <Button onClick={() => setShowForm(true)} className="bg-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Your First Communication
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Communication Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CommunicationLogForm
              onSuccess={handleCommunicationCreated}
              onCancel={() => setShowForm(false)}
              leads={leads}
            />
          </div>
        </div>
      )}
    </div>
  );
}
