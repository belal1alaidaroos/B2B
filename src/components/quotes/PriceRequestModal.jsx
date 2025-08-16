
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriceRequest } from '@/api/entities';
import { User } from '@/api/entities';
import { Task } from '@/api/entities';
import { createNotification } from '@/components/common/NotificationService';
import { logAuditEvent } from '@/components/common/AuditService';
import { DollarSign, Send, AlertCircle, Clock, User as UserIcon, Loader2, CheckCircle } from 'lucide-react';

export default function PriceRequestModal({
  isOpen,
  onClose,
  lineItem,
  quote,
  currentUser,
  onSuccess
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [financeUsers, setFinanceUsers] = useState([]);
  const [formData, setFormData] = useState({
    assigned_to_finance: '',
    priority: 'medium',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
    notes_from_sales: ''
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadFinanceUsers();
      // Reset form on open
      setFormData({
        assigned_to_finance: '',
        priority: 'medium',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes_from_sales: ''
      });
      setMessage(null);
    }
  }, [isOpen]);

  const loadFinanceUsers = async () => {
    try {
      const users = await User.list();
      const financeTeam = users.filter(user => 
        user.role === 'admin' || 
        user.email?.includes('finance') || 
        user.job_title?.toLowerCase().includes('finance') ||
        user.job_title?.toLowerCase().includes('pricing') ||
        user.department_id === 'finance'
      );
      setFinanceUsers(financeTeam);
    } catch (error) {
      console.error('Error loading finance users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    
    if (!formData.assigned_to_finance) {
      setMessage({ type: 'error', text: 'Please select a finance team member' });
      return;
    }

    if (!formData.notes_from_sales.trim()) {
      setMessage({ type: 'error', text: 'Please add notes explaining why you need special pricing' });
      return;
    }

    setIsSubmitting(true);
    try {
      const priceRequestData = {
        requested_by: currentUser?.id,
        lead_id: quote?.lead_id || '',
        quote_id: quote?.id || '',
        request_details: {
          job_profile_id: lineItem?.job_profile_id || '',
          job_profile_title: lineItem?.job_profile_title || '',
          nationality: lineItem?.nationality || '',
          nationality_id: lineItem?.nationality_id || '',
          quantity: lineItem?.quantity || 1,
          contract_duration: lineItem?.contract_duration || '12',
          location: 'TBD',
          notes_from_sales: formData.notes_from_sales
        },
        status: 'pending',
        assigned_to_finance: formData.assigned_to_finance,
        due_date: new Date(formData.due_date).toISOString(),
        priority: formData.priority
      };

      const createdRequest = await PriceRequest.create(priceRequestData);

      const financeUser = financeUsers.find(u => u.id === formData.assigned_to_finance);
      if (financeUser) {
        await Task.create({
          title: `Review Price Request: ${lineItem?.job_profile_title || 'Quote Line Item'}`,
          description: `New price request from ${currentUser?.full_name || 'Sales Team'} for Quote #${quote?.quote_number || ''}. Please review details and provide appropriate pricing.`,
          task_type: 'pricing_review',
          status: 'pending',
          priority: formData.priority,
          assigned_to: formData.assigned_to_finance,
          assigned_by: currentUser?.id,
          due_date: new Date(formData.due_date).toISOString(),
          related_entity_type: 'price_request',
          related_entity_id: createdRequest.id
        });
      }

      await Task.create({
        title: `Follow-up Price Request: ${lineItem?.job_profile_title || 'Quote Line Item'}`,
        description: `Price request sent to Finance team. Please follow up on ${formData.due_date}.`,
        task_type: 'follow_up',
        status: 'pending',
        priority: 'medium',
        assigned_to: currentUser?.id,
        assigned_by: currentUser?.id,
        due_date: new Date(formData.due_date).toISOString(),
        related_entity_type: 'price_request',
        related_entity_id: createdRequest.id
      });

      if (financeUser) {
        await createNotification({
          type: 'price_request',
          title: 'New Price Request Assigned',
          message: `${currentUser?.full_name || 'Sales Team'} has submitted a new price request for ${lineItem?.job_profile_title || 'a quote line item'}. Please review and respond by ${formData.due_date}.`,
          recipient_user_id: formData.assigned_to_finance,
          sender_user_id: currentUser?.id,
          priority: formData.priority,
          action_url: `/PriceRequests?id=${createdRequest.id}`,
          data: {
            price_request_id: createdRequest.id,
            quote_id: quote?.id,
            line_item_title: lineItem?.job_profile_title
          }
        });
      }
      
      await logAuditEvent({
          action: 'create_price_request',
          entityType: 'PriceRequest',
          entityId: createdRequest.id,
          entityName: `${lineItem?.job_profile_title || 'Quote Line Item'} - Price Request`,
          newValues: priceRequestData,
          actorId: currentUser?.id,
      });
      
      setMessage({ type: 'success', text: 'Price request submitted successfully! The finance team has been notified.' });
      setTimeout(() => {
        onSuccess(createdRequest);
      }, 1500);

    } catch (error) {
      console.error('Error submitting price request:', error);
      setMessage({ type: 'error', text: 'Failed to submit price request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl clay-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Request Special Pricing
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Submit a request to the finance team for items that need special pricing.
          </p>
        </DialogHeader>
        <div className="py-2 space-y-4">
          {message && (
             <Alert className={`mb-4 ${
                message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
             }`}>
                {message.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                <AlertTitle className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {message.type === 'success' ? 'Success' : 'Error'}
                </AlertTitle>
                <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                    {message.text}
                </AlertDescription>
            </Alert>
          )}

          <Card className="bg-gray-50/50 border-gray-200">
              <CardHeader className="pb-2">
                  <CardTitle className="text-base">Request Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><span className="font-medium text-gray-600">Item:</span> {lineItem?.job_profile_title || 'N/A'}</div>
                  <div><span className="font-medium text-gray-600">Nationality:</span> {lineItem?.nationality || 'N/A'}</div>
                  <div><span className="font-medium text-gray-600">Quantity:</span> {lineItem?.quantity || 'N/A'}</div>
                  <div><span className="font-medium text-gray-600">Term:</span> {lineItem?.contract_duration || 'N/A'} months</div>
              </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assigned-to">Assign to (Finance Team)</Label>
                <Select
                  value={formData.assigned_to_finance}
                  onValueChange={(value) => setFormData(p => ({ ...p, assigned_to_finance: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="assigned-to" className="clay-element">
                    <SelectValue placeholder="Select a team member..." />
                  </SelectTrigger>
                  <SelectContent className="clay-card">
                    {financeUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData(p => ({ ...p, priority: value }))}
                        disabled={isSubmitting}
                    >
                        <SelectTrigger id="priority" className="clay-element">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="clay-card">
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label htmlFor="due-date">Due Date</Label>
                    <Input
                        id="due-date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData(p => ({ ...p, due_date: e.target.value }))}
                        className="clay-element"
                        disabled={isSubmitting}
                    />
                 </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Justification Notes</Label>
              <Textarea
                id="notes"
                placeholder="Explain why a special price is needed for this item..."
                className="h-24 clay-element"
                value={formData.notes_from_sales}
                onChange={(e) => setFormData(p => ({ ...p, notes_from_sales: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto clay-button bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
