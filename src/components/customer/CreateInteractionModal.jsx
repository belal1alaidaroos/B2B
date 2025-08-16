import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomerInteraction } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { MessageSquare, Send, X, Upload } from 'lucide-react';

export default function CreateInteractionModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onInteractionCreated 
}) {
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    interaction_type: 'general_inquiry',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.content.trim()) return;

    setIsSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      const messageId = `msg_${Date.now()}`;

      const newInteraction = {
        customer_user_id: currentUser.id,
        account_id: currentUser.associated_account_id || '',
        lead_id: currentUser.associated_lead_id || '',
        subject: formData.subject,
        interaction_type: formData.interaction_type,
        status: 'open',
        priority: formData.priority,
        messages: [{
          id: messageId,
          sender_id: currentUser.id,
          sender_type: 'customer',
          sender_name: currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`,
          content: formData.content,
          timestamp,
          attachments: [],
          is_internal_note: false
        }],
        last_customer_reply_at: timestamp,
        department: getDepartmentByType(formData.interaction_type)
      };

      const createdInteraction = await CustomerInteraction.create(newInteraction);

      // Send notification to staff
      try {
        await SendEmail({
          to: 'support@claystaff.com', // You might want to make this configurable
          subject: `New Customer Interaction: ${formData.subject}`,
          body: `
            <h3>New Customer Interaction Created</h3>
            <p><strong>Customer:</strong> ${currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`}</p>
            <p><strong>Email:</strong> ${currentUser.email}</p>
            <p><strong>Subject:</strong> ${formData.subject}</p>
            <p><strong>Type:</strong> ${formData.interaction_type.replace('_', ' ')}</p>
            <p><strong>Priority:</strong> ${formData.priority}</p>
            <p><strong>Message:</strong></p>
            <div style="padding: 15px; background-color: #f5f5f5; border-radius: 5px; margin: 10px 0;">
              ${formData.content.replace(/\n/g, '<br>')}
            </div>
            <p>Please log into the staff portal to respond to this interaction.</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send staff notification:', emailError);
      }

      // Reset form
      setFormData({
        subject: '',
        content: '',
        interaction_type: 'general_inquiry',
        priority: 'medium'
      });

      onInteractionCreated(createdInteraction);
      onClose();
    } catch (error) {
      console.error('Failed to create interaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDepartmentByType = (type) => {
    const mapping = {
      'general_inquiry': 'operations',
      'technical_support': 'technical_support',
      'billing_question': 'finance',
      'complaint': 'escalation',
      'feature_request': 'operations',
      'sales_inquiry': 'sales'
    };
    return mapping[type] || 'operations';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Create New Support Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Subject *
            </label>
            <Input
              placeholder="Brief description of your request..."
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Type
              </label>
              <Select
                value={formData.interaction_type}
                onValueChange={(value) => setFormData({...formData, interaction_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general_inquiry">General Inquiry</SelectItem>
                  <SelectItem value="technical_support">Technical Support</SelectItem>
                  <SelectItem value="billing_question">Billing Question</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="sales_inquiry">Sales Inquiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Priority
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Message *
            </label>
            <Textarea
              placeholder="Please provide detailed information about your request..."
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="min-h-[120px]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.subject.trim() || !formData.content.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}