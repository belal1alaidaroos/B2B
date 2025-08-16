
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Eye, Edit, User, Mail, Phone, Briefcase } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePermissions } from '@/components/hooks/usePermissions';
import ProtectedComponent, { ProtectedField, ProtectedButton } from '@/components/common/ProtectedComponent';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  do_not_contact: 'bg-red-100 text-red-800'
};

const authorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  executive: 'bg-purple-100 text-purple-800',
};

export default function ContactList({ contacts, accounts, viewMode, onEdit }) {
  const { canUpdate } = usePermissions();

  const getAccountName = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.company_name : 'Unknown Company';
  };

  if (viewMode === 'table') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
            <tr>
              <th scope="col" className="px-3 py-2">Contact</th>
              <th scope="col" className="px-3 py-2">Company</th>
              <th scope="col" className="px-3 py-2">Title</th>
              <th scope="col" className="px-3 py-2">Authority</th>
              <th scope="col" className="px-3 py-2">Status</th>
              <th scope="col" className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map(contact => (
              <tr key={contact.id} className="border-b border-gray-200/50 hover:bg-gray-50/30">
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                        {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{contact.first_name} {contact.last_name}</p>
                      <p className="text-xs text-gray-500">{contact.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-1.5 text-gray-600 text-xs">{getAccountName(contact.account_id)}</td>
                <td className="px-3 py-1.5 text-gray-600 text-xs">{contact.job_title}</td>
                <td className="px-3 py-1.5">
                  {contact.authority_level && (
                    <Badge className={`${authorityColors[contact.authority_level]} border-none capitalize text-xs`}>
                      {contact.authority_level}
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-1.5">
                  <Badge className={`${statusColors[contact.status]} border-none capitalize text-xs`}>
                    {contact.status.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/50" onClick={() => onEdit(contact)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <ProtectedButton module="contacts" action="update">
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/50" onClick={() => onEdit(contact)}>
                        <Edit className="w-3.5 h-3.5" />
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

  // Grid view
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-2">
      {contacts.map(contact => (
        <Card key={contact.id} className="clay-card border-none hover:shadow-lg transition-all duration-200 group" onClick={() => onEdit(contact)}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                 <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                    {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-sm text-gray-800">{contact.first_name} {contact.last_name}</h3>
                   <p className="text-xs text-gray-500">{contact.job_title}</p>
                </div>
              </div>
               <Badge className={`${statusColors[contact.status]} border-none capitalize text-xs`}>
                {contact.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-1 text-xs text-gray-600 mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-3 h-3" />
                <span className="truncate">{getAccountName(contact.account_id)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3" />
                <span className="truncate">{contact.email}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                <Badge className={`${authorityColors[contact.authority_level]} border-none capitalize text-xs`}>
                    {contact.authority_level} Authority
                </Badge>
                <div className="flex gap-0.5">
                     <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/50" onClick={(e) => {e.stopPropagation(); onEdit(contact)}}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <ProtectedButton module="contacts" action="update">
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/50" onClick={(e) => {e.stopPropagation(); onEdit(contact)}}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </ProtectedButton>
                </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
