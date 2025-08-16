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
 * @param {string} [options.recipient_user_id] - Specific user to notify.
 * @param {string} [options.recipient_role_id] - Specific role to notify.
 */
export const createNotification = async (options) => {
  try {
    const currentUser = await User.me();
    
    // In a real scenario, if recipient_role_id is provided, you'd fetch all users with that role.
    // Here we simplify: if no specific user, we assume it's for an admin or manager,
    // which the notification bell component can later filter.
    // For this demo, we'll create a single notification and assign it to a placeholder if no user is specified.
    
    const recipientId = options.recipient_user_id || 'system_notification_recipient'; // Placeholder

    const notificationData = {
      recipient_user_id: recipientId,
      sender_user_id: currentUser.id,
      type: options.type,
      title: options.title,
      message: options.message,
      data: {
          ...options.data,
          recipient_role_id: options.recipient_role_id, // Store the role for filtering
      },
      action_url: options.action_url,
      is_read: false,
    };

    await Notification.create(notificationData);
    console.log("Notification created:", notificationData);

  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};