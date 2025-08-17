import { Notification } from '@/api/entities';
import { User } from '@/api/entities';
import { Role } from '@/api/entities';

export const NotificationService = {
  async sendDiscountRequestNotification({
    quoteId,
    quoteName,
    requestedByUserId,
    approverRoleId,
    discountType,
    discountPercentage,
    justification
  }) {
    try {
      console.log('Sending discount request notification...', {
        quoteId,
        quoteName,
        requestedByUserId,
        approverRoleId,
        discountType,
        discountPercentage
      });

      // Find all users with the approver role
      const allUsers = await User.list();
      const approverUsers = allUsers.filter(user => user.roles?.includes(approverRoleId));

      console.log(`Found ${approverUsers.length} user(s) with role ID ${approverRoleId}`);

      if (approverUsers.length === 0) {
          const allRoles = await Role.list();
          const approverRole = allRoles.find(r => r.id === approverRoleId);
          const roleName = approverRole ? approverRole.display_name : `ID: ${approverRoleId}`;
          const reason = `No users found with the required approval role: "${roleName}".`;
          console.error(`NOTIFICATION_ERROR: ${reason}`);
          return { success: false, reason: reason };
      }

      // Send notification to each approver
      const notifications = approverUsers.map(approver => ({
        RecipientUserId: approver.id,
        SenderUserId: requestedByUserId,
        Type: 'discount_request',
        Title: `Discount Approval Required: ${quoteName}`,
        Message: `A ${discountPercentage}% discount has been requested for ${discountType} on quote ${quoteName}. Justification: ${justification}`,
        Data: JSON.stringify({
          quote_id: quoteId,
          discount_type: discountType,
          discount_percentage: discountPercentage,
          justification: justification
        }),
        Priority: 'high',
        IsRead: false,
        ActionUrl: `/QuoteCreator?id=${quoteId}`
      }));

      // Create notifications
      for (const notification of notifications) {
        await Notification.create(notification);
        console.log('Notification created for user:', notification.RecipientUserId);
      }

      console.log('All discount request notifications sent successfully');
      return { success: true };
    } catch (error) {
      console.error('Error sending discount request notification:', error);
      throw error;
    }
  },

  async sendDiscountDecisionNotification({
    quoteId,
    quoteName,
    recipientUserId,
    approverUserId,
    decision,
    discountType,
    discountPercentage,
    approverNotes
  }) {
    try {
      // If recipientUserId is missing, try to find it from the quote's created_by field
      let finalRecipientUserId = recipientUserId;
      
      if (!finalRecipientUserId) {
        console.warn('recipientUserId is missing, trying to find creator from created_by field...');
        
        try {
          const { Quote } = await import('@/api/entities');
          const quoteData = await Quote.filter({ id: quoteId });
          
          if (quoteData && quoteData.length > 0) {
            const quote = quoteData[0];
            
            // Try to get from creator_user_id first, then from created_by email
            if (quote.creator_user_id) {
              finalRecipientUserId = quote.creator_user_id;
              console.log('Found creator_user_id:', finalRecipientUserId);
            } else if (quote.created_by) {
              // Find user by email
              const allUsers = await User.list();
              const creatorUser = allUsers.find(u => u.email === quote.created_by);
              if (creatorUser) {
                finalRecipientUserId = creatorUser.id;
                console.log('Found creator by email:', quote.created_by, '-> ID:', finalRecipientUserId);
              }
            }
          }
        } catch (error) {
          console.error('Error trying to find quote creator:', error);
        }
      }

      if (!finalRecipientUserId) {
        console.error('Could not determine who to send the notification to. Skipping notification.');
        return false;
      }

      const notification = {
        RecipientUserId: finalRecipientUserId,
        SenderUserId: approverUserId,
        Type: decision === 'approved' ? 'discount_approved' : 'discount_rejected',
        Title: `Discount ${decision === 'approved' ? 'Approved' : 'Rejected'}: ${quoteName}`,
        Message: `Your ${discountPercentage}% discount request for ${discountType} on quote ${quoteName} has been ${decision}. ${approverNotes ? 'Notes: ' + approverNotes : ''}`,
        Data: JSON.stringify({
          quote_id: quoteId,
          discount_type: discountType,
          discount_percentage: discountPercentage,
          decision: decision
        }),
        Priority: 'medium',
        IsRead: false,
        ActionUrl: `/QuoteCreator?id=${quoteId}`
      };

      await Notification.create(notification);
      console.log('Discount decision notification sent successfully to user:', finalRecipientUserId);
      return true;
    } catch (error) {
      console.error('Error sending discount decision notification:', error);
      // Don't throw error - we don't want notification failure to break the approval process
      return false;
    }
  }
};