
import React, { useState, useEffect } from 'react';
import { PriceRequest } from '@/api/entities';
import { Lead } from '@/api/entities';
import { User } from '@/api/entities';
import { Role } from '@/api/entities';
import { JobProfile } from '@/api/entities';
import { Task } from '@/api/entities';
import { createNotification } from '@/components/common/NotificationService';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import PriceRequestStats from '../components/pricing/PriceRequestStats';
import PriceRequestFilters from '../components/pricing/PriceRequestFilters';
import PriceRequestCard from '../components/pricing/PriceRequestCard';
import PriceRequestResponse from '../components/pricing/PriceRequestResponse';
import { Skeleton } from '@/components/ui/skeleton';
import ProtectedComponent from '@/components/common/ProtectedComponent';

export default function PriceRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [jobProfiles, setJobProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', priority: 'all' });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reqs, lds, usrs, rls, profiles] = await Promise.all([
        PriceRequest.list('-created_date'),
        Lead.list(),
        User.list(),
        Role.list(),
        JobProfile.list(),
      ]);
      setRequests(reqs || []);
      setLeads(lds || []);
      setUsers(usrs || []);
      setRoles(rls || []);
      setJobProfiles(profiles || []);
    } catch (error) {
      console.error("Error loading price requests:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
  };
  
  const handleCloseDialog = () => {
    setSelectedRequest(null);
  };

  // Add this function to handle status updates with notifications
  const handleStatusUpdate = async (requestId, newStatus, responseData = {}) => {
    try {
      const updatedRequest = await PriceRequest.update(requestId, {
        status: newStatus,
        finance_response: responseData.finance_response || {},
        final_quoted_price: responseData.final_quoted_price || 0
      });

      // Send notification to the original requester (sales person)
      const originalRequest = requests.find(r => r.id === requestId);
      if (originalRequest && originalRequest.requested_by) {
        let notificationTitle = '';
        let notificationMessage = '';
        
        switch (newStatus) {
          case 'approved':
            notificationTitle = 'Price Request Approved';
            notificationMessage = `Your price request has been approved. Approved price: ${responseData.final_quoted_price || 'Not set'}`;
            break;
          case 'rejected':
            notificationTitle = 'Price Request Rejected';
            notificationMessage = `Your price request has been rejected. Reason: ${responseData.finance_response?.notes_from_finance || 'Not specified'}`;
            break;
          case 'quoted':
            notificationTitle = 'Quotation Provided';
            notificationMessage = `A quotation has been provided for your request. Proposed price: ${responseData.final_quoted_price || 'Not set'}`;
            break;
          default:
            notificationTitle = 'Price Request Updated';
            notificationMessage = `The status of your price request has been updated to: ${newStatus}`;
        }

        await createNotification({
          type: 'price_request_updated',
          title: notificationTitle,
          message: notificationMessage,
          recipient_user_id: originalRequest.requested_by,
          sender_user_id: currentUser?.id,
          priority: 'medium',
          action_url: `/price-requests?id=${requestId}`,
          data: {
            price_request_id: requestId,
            new_status: newStatus,
            final_quoted_price: responseData.final_quoted_price
          }
        });

        // Create/Update follow-up task for sales person
        await Task.create({
          title: `Follow-up on Price Request - ${originalRequest.request_details?.job_profile_title || 'Line Item'}`,
          description: `Your price request has been ${newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'updated'}. Please review details and update the quote if necessary.`,
          task_type: 'price_request_follow_up',
          status: 'pending',
          priority: 'high',
          assigned_to: originalRequest.requested_by,
          assigned_by: currentUser?.id,
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          related_entity_type: 'price_request',
          related_entity_id: requestId
        });
      }

      return updatedRequest;
    } catch (error) {
      console.error('Error updating price request status:', error);
      throw error;
    }
  };

  const handleResponseSuccess = async (newStatus, responseData) => {
    if (selectedRequest) {
      try {
        await handleStatusUpdate(selectedRequest.id, newStatus, responseData);
        handleCloseDialog();
        loadData(); // Refresh the data after a successful response
      } catch (error) {
        console.error("Failed to process price request response:", error);
        // Optionally display an error message to the user
      }
    }
  };

  const filteredRequests = requests.filter(req => {
    const statusMatch = filters.status === 'all' || req.status === filters.status;
    const priorityMatch = filters.priority === 'all' || req.priority === filters.priority;
    return statusMatch && priorityMatch;
  });

  const financeUsers = users.filter(user => {
      const financeRole = roles.find(r => r.name === 'finance');
      return user.roles?.includes(financeRole?.id);
  });

  return (
    <ProtectedComponent module="price_requests" action="read">
      <div className="p-4 space-y-4 min-h-screen">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Price Requests Inbox</h1>
            <p className="text-sm text-gray-600">Review, assign, and respond to special price requests from the sales team.</p>
          </div>
        </div>
        
        <PriceRequestStats requests={requests} isLoading={isLoading} />

        <div className="clay-card p-4">
            <PriceRequestFilters onFiltersChange={setFilters} />
            <div className="mt-4 space-y-3">
                 {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))
                ) : filteredRequests.length > 0 ? (
                    filteredRequests.map(request => (
                        <PriceRequestCard 
                            key={request.id}
                            request={request}
                            lead={leads.find(l => l.id === request.lead_id)}
                            requester={users.find(u => u.id === request.requested_by)}
                            onView={handleViewRequest}
                        />
                    ))
                ) : (
                    <div className="text-center py-16 text-gray-500">
                        <ClipboardCheck className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <h3 className="text-lg font-semibold">No Price Requests Found</h3>
                        <p>When new requests are submitted, they will appear here.</p>
                    </div>
                )}
            </div>
        </div>
        
        <Dialog open={!!selectedRequest} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col clay-card">
                 <DialogHeader>
                    <DialogTitle>Price Request Details</DialogTitle>
                    <DialogDescription>
                      Review the details and submit your response.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-grow overflow-y-auto pr-6">
                    {selectedRequest && (
                        <PriceRequestResponse 
                            request={selectedRequest}
                            lead={leads.find(l => l.id === selectedRequest.lead_id)}
                            financeTeam={financeUsers}
                            onSuccess={handleResponseSuccess}
                            jobProfiles={jobProfiles}
                        />
                    )}
                  </div>
            </DialogContent>
        </Dialog>
      </div>
    </ProtectedComponent>
  );
}
