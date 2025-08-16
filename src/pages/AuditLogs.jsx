import React, { useState, useEffect } from 'react';
import { AuditLog } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Shield,
  Search,
  Filter,
  Download,
  Calendar as CalendarIcon,
  User as UserIcon,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  FileText,
  Lock,
  Globe,
  Zap
} from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { usePermissions } from '@/components/hooks/usePermissions';
import ProtectedComponent from '@/components/common/ProtectedComponent';

import AuditLogCard from '../components/audit/AuditLogCard';
import AuditLogStats from '../components/audit/AuditLogStats';
import AuditLogFilters from '../components/audit/AuditLogFilters';

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    action: 'all',
    entityType: 'all',
    userId: 'all',
    riskLevel: 'all',
    category: 'all',
    success: 'all',
    complianceRelevant: 'all',
    dateRange: 'last_7_days'
  });
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const { canRead, canExport } = usePermissions();

  useEffect(() => {
    if (canRead('audit_logs')) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [canRead, filters]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [auditLogsData, usersData] = await Promise.all([
        AuditLog.list('-created_date', 100), // Get last 100 logs by default
        User.list()
      ]);
      
      setAuditLogs(auditLogsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error("Error loading audit logs:", error);
      setAuditLogs([]);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExport = async () => {
    try {
      // In a real implementation, this would export filtered audit logs
      const exportData = filteredLogs.map(log => ({
        Timestamp: format(new Date(log.created_date), 'yyyy-MM-dd HH:mm:ss'),
        User: log.user_name || log.user_email,
        Action: log.action,
        Entity: log.entity_type,
        'Entity Name': log.entity_name || '',
        'Risk Level': log.risk_level,
        Success: log.success ? 'Yes' : 'No',
        'IP Address': log.ip_address || '',
        'Changes Summary': log.changes_summary || ''
      }));

      // Convert to CSV (simplified)
      const csv = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.changes_summary?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filters.action === 'all' || log.action === filters.action;
    const matchesEntityType = filters.entityType === 'all' || log.entity_type === filters.entityType;
    const matchesUser = filters.userId === 'all' || log.user_id === filters.userId;
    const matchesRisk = filters.riskLevel === 'all' || log.risk_level === filters.riskLevel;
    const matchesCategory = filters.category === 'all' || log.category === filters.category;
    const matchesSuccess = filters.success === 'all' || 
      (filters.success === 'success' && log.success) ||
      (filters.success === 'failed' && !log.success);
    const matchesCompliance = filters.complianceRelevant === 'all' ||
      (filters.complianceRelevant === 'yes' && log.compliance_relevant) ||
      (filters.complianceRelevant === 'no' && !log.compliance_relevant);

    return matchesSearch && matchesAction && matchesEntityType && matchesUser && 
           matchesRisk && matchesCategory && matchesSuccess && matchesCompliance;
  });

  if (!canRead('audit_logs')) {
    return <ProtectedComponent module="audit_logs" />;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            Audit Logs
          </h1>
          <p className="text-sm text-gray-600">Monitor all user activities and system changes for security and compliance.</p>
        </div>
        <div className="flex gap-2">
          {canExport('audit_logs') && (
            <Button onClick={handleExport} variant="outline" className="bg-white">
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
          )}
          <Button 
            onClick={loadData} 
            variant="outline" 
            className="bg-white"
            disabled={isLoading}
          >
            <Activity className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <AuditLogStats auditLogs={auditLogs} isLoading={isLoading} />

      {/* Filters */}
      <Card className="clay-card border-none">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by user, entity name, or changes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 clay-element border-none"
                />
              </div>
            </div>

            <AuditLogFilters 
              filters={filters}
              onFilterChange={handleFilterChange}
              users={users}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      <Card className="clay-card border-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              System Activity Log
            </span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {filteredLogs.length} entries
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(10).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 clay-element">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No audit logs found</h3>
              <p className="text-gray-500">
                {searchTerm || Object.values(filters).some(f => f !== 'all' && f !== 'last_7_days')
                  ? 'Try adjusting your search criteria or filters'
                  : 'System activities will appear here'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map(log => (
                <AuditLogCard key={log.id} log={log} users={users} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}