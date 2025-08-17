import { Notification } from '@/api/entities';
import { User } from '@/api/entities';

/**
 * Creates and saves a notification.
 * This is a simplified version. A real system would have more complex logic for finding recipients.
 * 
 * @param {object} options - Notification options.
 * @param {string} options.type - The notification type.
 * @param {string} options.title - The notification title.
 * @param {string} options.message - The notification message.
 * @param {string} [options.action_url] - URL to navigate to.
 * @param {string} [options.recipient_user_id] - Specific user to notify (legacy).
 * @param {string} [options.RecipientUserId] - Specific user to notify.
 * @param {string} [options.recipient_role_id] - Specific role to notify.
 */
export const createNotification = async (options) => {
  try {
    const currentUser = await User.me();
    
    // Handle both old snake_case and new PascalCase parameter names for backward compatibility
    const recipientId = options.RecipientUserId || options.recipient_user_id || 'system_notification_recipient';
    const senderId = options.SenderUserId || options.sender_user_id || currentUser?.id;

    const notificationData = {
      RecipientUserId: recipientId,
      SenderUserId: senderId,
      Type: options.type,
      Title: options.title,
      Message: options.message,
      Data: JSON.stringify(options.data || {}),
      Priority: options.priority || 'medium',
      IsRead: false,
      ActionUrl: options.action_url
    };

    await Notification.create(notificationData);
    console.log("Notification created:", notificationData);

  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};