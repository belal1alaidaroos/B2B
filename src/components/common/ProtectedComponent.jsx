import { usePermissions } from '@/components/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';

export default function ProtectedComponent({ 
  module, 
  action = 'read', 
  children, 
  fallback = null,
  showAlert = true 
}) {
  const { hasPermission, isLoading } = usePermissions();

  // Don't block rendering while loading - show children with basic fallback
  if (isLoading) {
    return children || <div className="opacity-50">Loading...</div>;
  }

  if (!hasPermission(module, action)) {
    if (fallback) return fallback;
    
    if (showAlert) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You don't have permission to {action} {module}. Contact your administrator.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  return children;
}

// Convenience components for common actions - optimized for faster loading
export function ProtectedButton({ module, action = 'create', children, ...props }) {
  const { hasPermission, isLoading } = usePermissions();
  
  // Show buttons immediately, don't wait for permission check
  if (isLoading) {
    return children;
  }
  
  if (!hasPermission(module, action)) {
    return null;
  }
  
  return children;
}

export function ProtectedField({ module, action = 'view_email', children, hideValue = '***' }) {
  const { hasPermission, isLoading } = usePermissions();
  
  if (isLoading) {
    return children; // Show content while loading
  }
  
  if (!hasPermission(module, action)) {
    return <span className="text-gray-400">{hideValue}</span>;
  }
  
  return children;
}