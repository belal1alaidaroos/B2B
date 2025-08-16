
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Phone, Mail, Eye, Edit, Users, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { usePermissions } from '@/components/hooks/usePermissions'; // Changed import path here
import ProtectedComponent, { ProtectedField, ProtectedButton } from '@/components/common/ProtectedComponent';

const statusColors = {
  prospect: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  blacklisted: 'bg-red-100 text-red-800'
};

const industryColors = {
  construction: 'bg-orange-100 text-orange-800',
  hospitality: 'bg-purple-100 text-purple-800',
  manufacturing: 'bg-blue-100 text-blue-800',
  healthcare: 'bg-red-100 text-red-800',
  retail: 'bg-pink-100 text-pink-800',
  logistics: 'bg-indigo-100 text-indigo-800',
  oil_gas: 'bg-yellow-100 text-yellow-800',
  technology: 'bg-cyan-100 text-cyan-800',
  finance: 'bg-green-100 text-green-800',
  government: 'bg-gray-100 text-gray-800',
  other: 'bg-slate-100 text-slate-800'
};

export default function AccountList({ accounts, contacts, viewMode, onEdit }) {
  const { canUpdate, canDelete, canViewEmail, canViewMobile, canExport } = usePermissions();
  
  const getContactCount = (accountId) => {
    return contacts.filter(contact => contact.account_id === accountId).length;
  };

  if (viewMode === 'table') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
            <tr>
              <th scope="col" className="px-4 py-2">Company</th>
              <th scope="col" className="px-4 py-2">Industry</th>
              <th scope="col" className="px-4 py-2">Status</th>
              <th scope="col" className="px-4 py-2">Contacts</th>
              <th scope="col" className="px-4 py-2">Revenue</th>
              <th scope="col" className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(account => (
              <tr key={account.id} className="border-b border-gray-200/50 hover:bg-gray-50/30">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 clay-button flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{account.company_name}</p>
                      <ProtectedField module="accounts" action="view_email">
                        <p className="text-xs text-gray-500">{account.primary_email}</p>
                      </ProtectedField>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <Badge className={`${industryColors[account.industry]} border-none capitalize text-xs`}>
                    {account.industry?.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <Badge className={`${statusColors[account.account_status]} border-none capitalize text-xs`}>
                    {account.account_status}
                  </Badge>
                </td>
                <td className="px-4 py-2 font-medium text-gray-700">{getContactCount(account.id)}</td>
                <td className="px-4 py-2 font-medium text-gray-700">
                  {account.annual_revenue ? `$${(account.annual_revenue / 1000).toFixed(0)}K` : '-'}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-0.5">
                    <ProtectedButton module="accounts" action="read">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/50" onClick={() => onEdit(account)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </ProtectedButton>
                    <ProtectedButton module="accounts" action="update">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/50" onClick={() => onEdit(account)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </ProtectedButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Compact Grid view
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-2">
      {accounts.map(account => (
        <Card key={account.id} className="clay-card border-none hover:shadow-md transition-shadow duration-200 group" onClick={() => onEdit(account)}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 clay-button flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-gray-800 truncate">{account.company_name}</h3>
                  <Badge className={`${statusColors[account.account_status]} border-none capitalize text-xs`}>
                    {account.account_status}
                  </Badge>
                </div>
              </div>
              <div className="flex-shrink-0">
                 <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/50">
                    <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600 my-3">
              <div className="flex items-center gap-2">
                 <Badge className={`${industryColors[account.industry]} border-none capitalize`}>
                    {account.industry?.replace('_', ' ')}
                  </Badge>
                  <span className="text-gray-400">•</span>
                  <span>{account.company_size}</span>
              </div>
              {account.physical_address?.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{account.physical_address.city}, {account.physical_address.country}</span>
                </div>
              )}
              {account.primary_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  <ProtectedField module="accounts" action="view_email">
                    <span className="truncate">{account.primary_email}</span>
                  </ProtectedField>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5" />
                <span>{getContactCount(account.id)} contacts</span>
              </div>
              <div className="text-xs font-medium text-gray-800">
                {account.annual_revenue ? `Revenue: $${(account.annual_revenue / 1000).toFixed(0)}K` : ''}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
