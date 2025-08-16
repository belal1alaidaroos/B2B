import { DiscountApprovalMatrix } from '@/api/entities';
import { User } from '@/api/entities';
import { createNotification } from './NotificationService';
import { createPageUrl } from '@/utils';

/**
 * Finds the required approver role for a given discount percentage.
 * @param {number} discountPercent The discount percentage requested.
 * @param {'line_item' | 'overall_quote'} discountType The type of discount.
 * @returns {Promise<string|null>} The ID of the required approver role, or null if no approval is needed.
 */
export const getRequiredApproverRoleId = async (discountPercent, discountType) => {
    if (discountPercent <= 0) {
        return null; // No approval needed for zero or negative discount.
    }

    try {
        const rules = await DiscountApprovalMatrix.filter({ 
            discount_type: discountType,
            is_active: true 
        }, '-priority'); // Highest priority first

        for (const rule of rules) {
            if (discountPercent > rule.min_percentage && discountPercent <= rule.max_percentage) {
                return rule.approver_role_id;
            }
        }
        
        // If no rule matches, it might mean the discount is too high and needs a fallback approver.
        return null; 

    } catch (error) {
        console.error("Error finding approver role:", error);
        return null;
    }
};

/**
 * Submits an entity for approval and notifies the required approvers.
 * @param {object} options - The options for submission.
 * @param {'Quote' | 'QuoteLineItem'} options.entityType - The type of entity being submitted.
 * @param {string} options.entityId - The ID of the entity.
 * @param {string} options.requestorId - The ID of the user requesting approval.
 * @param {string} options.notes - Justification notes for the request.
 * @param {string} options.requiredRoleId - The ID of the role required for approval.
 * @param {object} options.metadata - Additional data for the notification.
 * @param {string} options.metadata.quoteId - The parent quote ID.
 * @param {string} options.metadata.quoteNumber - The quote number.
 * @param {'overall' | 'line_item'} options.metadata.discountType - The type of discount.
 * @param {number} options.metadata.discountPercentage - The requested discount percentage.
 * @param {string} [options.metadata.lineItemTitle] - The title of the line item, if applicable.
 * @returns {Promise<{success: boolean, reason?: string}>}
 */
export const submitForApproval = async (options) => {
    const {
        entityType,
        entityId,
        requestorId,
        notes,
        requiredRoleId,
        metadata
    } = options;

    if (!requiredRoleId) {
        return { success: false, reason: 'No approver role specified for this request.' };
    }
    
    if (!metadata || !metadata.quoteId) {
         return { success: false, reason: 'Missing metadata for approval notification.' };
    }

    try {
        const requestorList = await User.filter({ id: requestorId });
        const requestorName = requestorList.length > 0 ? requestorList[0].full_name : 'A team member';

        let title = '';
        let message = '';
        const action_url = createPageUrl(`QuoteCreator?id=${metadata.quoteId}`);

        if (metadata.discountType === 'overall') {
            title = `Overall Discount Approval for Quote ${metadata.quoteNumber}`;
            message = `${requestorName} has requested a ${metadata.discountPercentage}% overall discount. Justification: "${notes || 'No justification provided.'}"`;
        } else if (metadata.discountType === 'line_item') {
            title = `Line Item Discount Approval for Quote ${metadata.quoteNumber}`;
            message = `${requestorName} has requested a ${metadata.discountPercentage}% discount for item "${metadata.lineItemTitle}". Justification: "${notes || 'No justification provided.'}"`;
        } else {
             return { success: false, reason: 'Invalid discount type in metadata.' };
        }

        // Create a notification for users with the required role
        await createNotification({
            type: 'discount_request',
            title: title,
            message: message,
            action_url: action_url,
            // The backend/NotificationService should handle resolving role ID to user IDs.
            recipient_role_id: requiredRoleId, 
            data: {
                entityType: entityType,
                entityId: entityId,
                quoteId: metadata.quoteId,
            }
        });
        
        return { success: true };

    } catch (error) {
        console.error("Error submitting for approval:", error);
        return { success: false, reason: error.message || 'An internal error occurred.' };
    }
};