import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CustomerInteraction } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { User, Clock, Send, FileText, X, MessageSquare } from 'lucide-react';
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

export default function InteractionDetailModal({ 
  isOpen, 
  onClose, 
  interaction, 
  currentUser, 
  onUpdate 
}) {
  const [newMessage, setNewMessage] = useState('');
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
        sender_type: 'customer',
        sender_name: currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`,
        content: newMessage,
        timestamp,
        attachments: [],
        is_internal_note: false
      };

      const updatedMessages = [...(interaction.messages || []), newMessageObj];
      
      const updates = {
        messages: updatedMessages,
        status: 'waiting_customer', // Reset to waiting_customer when customer replies
        last_customer_reply_at: timestamp
      };

      await CustomerInteraction.update(interaction.id, updates);

      // Send notification to assigned staff
      if (interaction.assigned_to_employee_user_id) {
        try {
          await SendEmail({
            to: 'support@claystaff.com', // Should be actual staff email
            subject: `Customer Reply: ${interaction.subject}`,
            body: `
              <h3>Customer has replied to interaction</h3>
              <p><strong>Customer:</strong> ${currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`}</p>
              <p><strong>Subject:</strong> ${interaction.subject}</p>
              <p><strong>New Message:</strong></p>
              <div style="padding: 15px; background-color: #f5f5f5; border-radius: 5px; margin: 10px 0;">
                ${newMessage.replace(/\n/g, '<br>')}
              </div>
              <p>Please log into the staff portal to respond.</p>
            `
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }
      }

      setNewMessage('');
      onUpdate();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                {interaction.subject}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <span>Request #{interaction.id?.slice(-6)}</span>
                <span className="text-gray-400">•</span>
                <span>Created {format(new Date(interaction.created_date), 'MMM d, yyyy')}</span>
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
          {interaction.messages?.filter(msg => !msg.is_internal_note).map((message) => (
            <Card key={message.id} className={`${
              message.sender_type === 'customer' 
                ? 'bg-blue-50 border-blue-200 ml-0 mr-8' 
                : 'bg-green-50 border-green-200 ml-8 mr-0'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {message.sender_type === 'customer' ? 'You' : message.sender_name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {message.sender_type === 'customer' ? 'Customer' : 'Support Team'}
                    </Badge>
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
        {interaction.status !== 'closed' && (
          <div className="space-y-4 border-t pt-4">
            <Textarea
              placeholder="Type your reply..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[100px]"
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                Close
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
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {interaction.status === 'closed' && (
          <div className="border-t pt-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-600">This conversation has been closed.</p>
              <p className="text-sm text-gray-500 mt-1">
                If you need further assistance, please create a new support request.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}