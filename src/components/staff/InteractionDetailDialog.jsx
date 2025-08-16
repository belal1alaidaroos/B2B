import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CustomerInteraction } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { User, Clock, Send, FileText, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const getPriorityColor = (priority) => {
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800', 
    urgent: 'bg-red-100 text-red-800'
  };
  return colors[priority] || colors.medium;
};

const getStatusColor = (status) => {
  const colors = {
    open: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    waiting_customer: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    escalated: 'bg-red-100 text-red-800'
  };
  return colors[status] || colors.open;
};

export default function InteractionDetailDialog({ 
  isOpen, 
  onClose, 
  interaction, 
  customerInfo, 
  currentUser,
  templates,
  onUpdate 
}) {
  const [newMessage, setNewMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [newStatus, setNewStatus] = useState(interaction?.status || 'open');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!interaction) return null;

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const messageId = `msg_${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      const newMessageObj = {
        id: messageId,
        sender_id: currentUser.id,
        sender_type: 'staff',
        sender_name: currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`,
        content: newMessage,
        timestamp,
        attachments: [],
        is_internal_note: isInternal
      };

      const updatedMessages = [...(interaction.messages || []), newMessageObj];
      
      const updates = {
        messages: updatedMessages,
        status: newStatus,
        last_staff_reply_at: timestamp,
        assigned_to_employee_user_id: currentUser.id,
        assigned_to_employee_name: currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`,
      };

      // Calculate first response time if this is the first staff message
      const hasStaffReplied = interaction.messages?.some(msg => msg.sender_type === 'staff');
      if (!hasStaffReplied) {
        const createdTime = new Date(interaction.created_date);
        const responseTime = (new Date(timestamp) - createdTime) / (1000 * 60); // in minutes
        updates.first_response_time_minutes = Math.round(responseTime);
      }

      await CustomerInteraction.update(interaction.id, updates);

      // Send email notification to customer (only if not internal note)
      if (!isInternal) {
        try {
          const customerUser = await CustomerInteraction.filter({ id: interaction.customer_user_id });
          if (customerUser.length > 0) {
            await SendEmail({
              to: customerUser[0].email,
              subject: `Response to: ${interaction.subject}`,
              body: `
                <h3>You have received a response to your inquiry</h3>
                <p><strong>Subject:</strong> ${interaction.subject}</p>
                <p><strong>Message:</strong></p>
                <div style="padding: 15px; background-color: #f5f5f5; border-radius: 5px; margin: 10px 0;">
                  ${newMessage.replace(/\n/g, '<br>')}
                </div>
                <p>You can view and respond to this message by logging into your customer portal.</p>
                <p>Best regards,<br>ClayStaff Support Team</p>
              `
            });
          }
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }
      }

      setNewMessage('');
      setSelectedTemplate('');
      setIsInternal(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setNewMessage(template.content.replace(/\{customer_name\}/g, customerInfo.name));
      setSelectedTemplate(templateId);
    }
  };

  const departmentTemplates = templates.filter(t => 
    t.department === interaction.department && 
    (!t.interaction_type || t.interaction_type === interaction.interaction_type)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {interaction.subject}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {customerInfo.name} ({customerInfo.type})
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={`${getPriorityColor(interaction.priority)} border-none`}>
                {interaction.priority}
              </Badge>
              <Badge className={`${getStatusColor(interaction.status)} border-none`}>
                {interaction.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Messages Thread */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {interaction.messages?.map((message) => (
            <Card key={message.id} className={`${
              message.sender_type === 'customer' 
                ? 'bg-blue-50 border-blue-200' 
                : message.is_internal_note 
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {message.sender_name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {message.sender_type === 'customer' ? 'Customer' : 'Staff'}
                    </Badge>
                    {message.is_internal_note && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                        Internal Note
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {message.attachments.map((attachment, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-xs text-blue-600">
                        <FileText className="w-3 h-3" />
                        <span>{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reply Form */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex gap-2">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_customer">Waiting Customer</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>

            {departmentTemplates.length > 0 && (
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Use template..." />
                </SelectTrigger>
                <SelectContent>
                  {departmentTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Textarea
            placeholder="Type your response..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[100px]"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isInternal"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="isInternal" className="text-sm text-gray-600">
                Internal note (not visible to customer)
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSendMessage} 
                disabled={!newMessage.trim() || isSending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send {isInternal ? 'Note' : 'Reply'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}