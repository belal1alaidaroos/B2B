import { AuditLog } from '@/api/entities';
import { User } from '@/api/entities';

// A helper function to generate a human-readable summary of changes.
const generateChangesSummary = (entityType, oldValues, newValues) => {
    if (!oldValues || !newValues) return 'No changes summary available.';

    const changes = [];
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    allKeys.forEach(key => {
        // Ignore internal fields
        if (['id', 'created_date', 'updated_date', 'created_by'].includes(key)) {
            return;
        }

        const oldValue = oldValues[key];
        const newValue = newValues[key];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push(`'${key}' from "${oldValue}" to "${newValue}"`);
        }
    });

    if (changes.length === 0) return `No significant changes detected for ${entityType}.`;
    return `Updated ${changes.join(', ')}.`;
};


/**
 * Logs an audit trail record for a user action.
 * @param {object} options - The options for logging.
 * @param {string} options.action - The action performed (e.g., 'create', 'update', 'delete').
 * @param {string} options.entityType - The type of entity affected (e.g., 'Lead', 'Account').
 * @param {string} options.entityId - The ID of the affected entity.
 * @param {string} [options.entityName] - A human-readable name for the entity.
 * @param {object} [options.oldValues] - The state of the entity before the change.
 * @param {object} [options.newValues] - The state of the entity after the change.
 * @param {boolean} [options.success=true] - Whether the action was successful.
 * @param {string} [options.errorMessage] - Error message if the action failed.
 */
export const logAuditEvent = async (options) => {
    try {
        const currentUser = await User.me();
        
        const {
            action,
            entityType,
            entityId,
            entityName = '',
            oldValues = {},
            newValues = {},
            success = true,
            errorMessage = null
        } = options;

        let summary = `User ${currentUser.full_name} ${action}d a ${entityType}.`;
        if (action === 'update' && Object.keys(oldValues).length > 0) {
            summary = generateChangesSummary(entityType, oldValues, newValues);
        }

        const logEntry = {
            user_id: currentUser.id,
            user_email: currentUser.email,
            user_name: currentUser.full_name,
            action: action,
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName || newValues?.name || newValues?.title || newValues?.company_name || entityId,
            old_values: oldValues,
            new_values: newValues,
            changes_summary: summary,
            success: success,
            error_message: errorMessage,
            // These would ideally come from the backend/server environment
            ip_address: '127.0.0.1', // Placeholder
            risk_level: action === 'delete' || action === 'role_change' ? 'high' : 'low',
            category: 'data_modification'
        };

        await AuditLog.create(logEntry);

    } catch (error) {
        console.error("Failed to write to audit log:", error);
        // We don't re-throw the error, as failing to log shouldn't break the primary user action.
    }
};