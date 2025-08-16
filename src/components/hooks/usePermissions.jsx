
import { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { Role } from '@/api/entities';

// Module-level cache to prevent re-fetching on every render/navigation
let rolesCache = null;
let permissionsCache = null; // Cache for the final calculated permissions
let userCache = null; // Cache for the current user object

export function usePermissions() {
  const [permissions, setPermissions] = useState(permissionsCache);
  const [userRoles, setUserRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(!permissionsCache); // If permissions are cached, not loading initially
  const [currentUser, setCurrentUser] = useState(userCache);

  useEffect(() => {
    // If we have a cached result, don't reload
    if (permissionsCache && userCache) {
      return;
    }
    loadUserPermissions();
  }, []);

  const loadUserPermissions = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      userCache = user; // Cache the user
      
      // Check if user is admin by email or role attribute
      const isAdminUser = user.role === 'admin' || user.email?.includes('admin') || user.is_admin === true;
      
      if (!user.roles || user.roles.length === 0) {
        // Set default permissions for users without roles
        // If admin user, give full permissions
        const defaultPermissions = isAdminUser ? {
          dashboard: { read: true, export: true },
          leads: { read: true, create: true, update: true, delete: true, export: true, view_mobile: true, view_email: true },
          opportunities: { read: true, create: true, update: true, delete: true, export: true },
          tasks: { read: true, create: true, update: true, delete: true, export: true },
          quotes: { read: true, create: true, update: true, delete: true, export: true },
          accounts: { read: true, create: true, update: true, delete: true, export: true, view_mobile: true, view_email: true },
          contacts: { read: true, create: true, update: true, delete: true, export: true, view_mobile: true, view_email: true },
          communications: { read: true, create: true, update: true, delete: true, export: true },
          pricing_engine: { use: true },
          price_requests: { read: true, create: true, update: true, delete: true, respond: true },
          discount_approval_matrix: { read: true, create: true, update: true, delete: true },
          notifications: { read: true, create: true, update: true, delete: true, send: true, mark_read: true },
          users: { read: true, create: true, update: true, delete: true, manage_roles: true, view_mobile: true, view_email: true },
          roles: { read: true, create: true, update: true, delete: true },
          settings: { read: true, update: true },
          jobs: { read: true, create: true, update: true, delete: true, export: true },
          job_profiles: { read: true, create: true, update: true, delete: true },
          cost_components: { read: true, create: true, update: true, delete: true },
          pricing_rules: { read: true, create: true, update: true, delete: true },
          nationalities: { read: true, create: true, update: true, delete: true },
          countries: { read: true, create: true, update: true, delete: true },
          cities: { read: true, create: true, update: true, delete: true },
          territories: { read: true, create: true, update: true, delete: true },
          branches: { read: true, create: true, update: true, delete: true },
          departments: { read: true, create: true, update: true, delete: true },
          skill_levels: { read: true, create: true, update: true, delete: true }
        } : {
          dashboard: { read: true },
          leads: { read: true, create: true, update: true },
          opportunities: { read: true, create: true, update: true },
          tasks: { read: true, create: true, update: true },
          quotes: { read: true, create: true, update: true },
          accounts: { read: true, create: true, update: true },
          contacts: { read: true, create: true, update: true },
          communications: { read: true, create: true, update: true },
          pricing_engine: { use: true },
          price_requests: { read: true, create: true, update: true },
          discount_approval_matrix: { read: true },
          notifications: { read: true, mark_read: true }
        };
        
        setPermissions(defaultPermissions);
        permissionsCache = defaultPermissions; // Cache the permissions
        setIsLoading(false);
        return;
      }

      let rolesData;
      if (rolesCache) {
        console.log('Using cached roles for permissions.');
        rolesData = rolesCache;
      } else {
        console.log('Fetching roles from API for permissions.');
        rolesData = await Role.list();
        rolesCache = rolesData; // Store result in cache
      }
        
      const userRoleObjects = rolesData.filter(role => user.roles.includes(role.id));
      setUserRoles(userRoleObjects);

      // Merge all role capabilities
      const mergedPermissions = {};
      userRoleObjects.forEach(role => {
        if (role.capabilities) {
          Object.keys(role.capabilities).forEach(module => {
            if (!mergedPermissions[module]) {
              mergedPermissions[module] = {};
            }
            Object.keys(role.capabilities[module] || {}).forEach(action => {
              // If any role grants permission, user has it
              if (role.capabilities[module][action]) {
                mergedPermissions[module][action] = true;
              }
            });
          });
        }
      });

      setPermissions(mergedPermissions);
      permissionsCache = mergedPermissions; // Cache the final permissions object
      
    } catch (error) {
      console.error('Failed to load user permissions:', error);
      // Set default permissions on error, and clear cache to allow retry
      rolesCache = null;
      permissionsCache = null;
      userCache = null;
      setPermissions({
        dashboard: { read: true },
        leads: { read: true, create: true, update: true },
        opportunities: { read: true, create: true, update: true },
        tasks: { read: true, create: true, update: true },
        quotes: { read: true, create: true, update: true },
        accounts: { read: true, create: true, update: true },
        contacts: { read: true, create: true, update: true },
        communications: { read: true, create: true, update: true },
        pricing_engine: { use: true },
        price_requests: { read: true, create: true, update: true },
        discount_approval_matrix: { read: true },
        notifications: { read: true, mark_read: true }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = useCallback((module, action) => {
    if (!permissions) return false; // Block access during loading if no cache
    return permissions[module]?.[action] || false;
  }, [permissions]);

  const canAccess = useCallback((module, action = 'read') => {
    return hasPermission(module, action);
  }, [hasPermission]);

  const canCreate = useCallback((module) => hasPermission(module, 'create'), [hasPermission]);
  const canRead = useCallback((module) => hasPermission(module, 'read'), [hasPermission]);
  const canUpdate = useCallback((module) => hasPermission(module, 'update'), [hasPermission]);
  const canDelete = useCallback((module) => hasPermission(module, 'delete'), [hasPermission]);
  const canExport = useCallback((module) => hasPermission(module, 'export'), [hasPermission]);
  const canViewMobile = useCallback((module) => hasPermission(module, 'view_mobile'), [hasPermission]);
  const canViewEmail = useCallback((module) => hasPermission(module, 'view_email'), [hasPermission]);

  const isSuperAdmin = useCallback(() => {
    // Check multiple ways to determine if user is super admin
    if (!currentUser) return false;
    
    // 1. Check if user has role attribute set to admin
    if (currentUser.role === 'admin') return true;
    
    // 2. Check if user email contains admin
    if (currentUser.email?.includes('admin')) return true;
    
    // 3. Check if user has is_admin attribute
    if (currentUser.is_admin === true) return true;
    
    // 4. Check if user has a role named super_admin or admin
    const hasAdminRole = userRoles.some(role => 
      role.name === 'super_admin' || 
      role.name === 'admin' ||
      role.display_name?.toLowerCase().includes('super admin') ||
      role.display_name?.toLowerCase().includes('admin')
    );
    
    return hasAdminRole;
  }, [currentUser, userRoles]);

  return {
    permissions,
    userRoles,
    currentUser,
    isLoading,
    hasPermission,
    canAccess,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canExport,
    canViewMobile,
    canViewEmail,
    isSuperAdmin,
    refreshPermissions: () => {
        rolesCache = null; // Clear all caches to force a refresh
        permissionsCache = null;
        userCache = null;
        loadUserPermissions();
    }
  };
}
