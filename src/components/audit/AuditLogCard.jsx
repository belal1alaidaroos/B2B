
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Edit,
  Eye,
  Trash2,
  Plus,
  Download,
  Upload, // Added Upload import here
  Mail,
  FileText,
  User,
  Settings,
  Activity,
  Globe
} from 'lucide-react';
import { format } from 'date-fns';

const getActionIcon = (action) => {
  const iconMap = {
    create: Plus,
    update: Edit,
    delete: Trash2,
    view: Eye,
    export: Download,
    login: User,
    logout: User,
    email_sent: Mail,
    quote_sent: FileText,
    file_upload: Upload,
    file_download: Download,
    role_change: Settings,
    permission_change: Shield,
    default: Activity
  };
  return iconMap[action] || iconMap.default;
};

const getRiskColor = (level) => {
  const colorMap = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };
  return colorMap[level] || colorMap.low;
};

const getCategoryColor = (category) => {
  const colorMap = {
    authentication: 'bg-blue-100 text-blue-800',
    data_modification: 'bg-purple-100 text-purple-800',
    data_access: 'bg-green-100 text-green-800',
    system_configuration: 'bg-orange-100 text-orange-800',
    security: 'bg-red-100 text-red-800',
    communication: 'bg-cyan-100 text-cyan-800',
    financial: 'bg-amber-100 text-amber-800'
  };
  return colorMap[category] || 'bg-gray-100 text-gray-800';
};

export default function AuditLogCard({ log, users }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ActionIcon = getActionIcon(log.action);
  
  const user = users.find(u => u.id === log.user_id);
  const hasDetails = log.old_values || log.new_values || log.additional_context || log.error_message;

  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <Card className={`clay-element border-none hover:shadow-md transition-all duration-200 ${
      !log.success ? 'border-l-4 border-l-red-500' : 
      log.risk_level === 'critical' ? 'border-l-4 border-l-red-600' :
      log.risk_level === 'high' ? 'border-l-4 border-l-orange-500' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* User Avatar */}
          <Avatar className="w-8 h-8 mt-1">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
              {log.user_name?.charAt(0)?.toUpperCase() || log.user_email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <ActionIcon className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-800 text-sm">
                    {log.user_name || log.user_email}
                  </span>
                  <span className="text-sm text-gray-600">
                    {log.action.replace('_', ' ')} {log.entity_type}
                  </span>
                  {log.entity_name && (
                    <span className="text-sm font-medium text-blue-600">
                      "{log.entity_name}"
                    </span>
                  )}
                </div>

                {log.changes_summary && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {log.changes_summary}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-gray-500">
                    {format(new Date(log.created_date), 'MMM d, HH:mm:ss')}
                  </span>
                  
                  {log.ip_address && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <Globe className="w-3 h-3" />
                      <span>{log.ip_address}</span>
                    </div>
                  )}

                  <Badge className={getRiskColor(log.risk_level)}>
                    {log.risk_level}
                  </Badge>

                  {log.category && (
                    <Badge className={getCategoryColor(log.category)}>
                      {log.category.replace('_', ' ')}
                    </Badge>
                  )}

                  {log.compliance_relevant && (
                    <Badge className="bg-indigo-100 text-indigo-800">
                      Compliance
                    </Badge>
                  )}

                  {log.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>

              {/* Expand Button */}
              {hasDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 h-6 w-6"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Expanded Details */}
            {isExpanded && hasDetails && (
              <div className="mt-4 pt-4 border-t border-gray-200/50 space-y-3">
                {!log.success && log.error_message && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-red-800 text-sm">Error Details</span>
                    </div>
                    <p className="text-sm text-red-700">{log.error_message}</p>
                  </div>
                )}

                {log.old_values && Object.keys(log.old_values).length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 text-sm mb-2">Previous Values</h4>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                      {formatValue(log.old_values)}
                    </pre>
                  </div>
                )}

                {log.new_values && Object.keys(log.new_values).length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-gray-800 text-sm mb-2">New Values</h4>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                      {formatValue(log.new_values)}
                    </pre>
                  </div>
                )}

                {log.additional_context && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-gray-800 text-sm mb-2">Additional Context</h4>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                      {formatValue(log.additional_context)}
                    </pre>
                  </div>
                )}

                {log.user_agent && (
                  <div className="text-xs text-gray-500">
                    <strong>User Agent:</strong> {log.user_agent}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
