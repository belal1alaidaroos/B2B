import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  expired: 'bg-orange-100 text-orange-800',
  terminated: 'bg-red-100 text-red-800',
  pending_renewal: 'bg-blue-100 text-blue-800',
};

const formatCurrency = (value) => {
    if (value === null || typeof value === 'undefined') return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED',
    }).format(value);
};

export default function ContractList({ contracts, accounts, onEdit, onDelete }) {
  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.company_name : 'Unknown Account';
  };

  if (contracts.length === 0) {
    return <div className="text-center p-8 text-gray-500">No contracts found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
          <tr>
            <th scope="col" className="px-4 py-3">Contract #</th>
            <th scope="col" className="px-4 py-3">Account</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Start Date</th>
            <th scope="col" className="px-4 py-3">End Date</th>
            <th scope="col" className="px-4 py-3">Value</th>
            <th scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr key={contract.id} className="border-b hover:bg-gray-50/30">
              <td className="px-4 py-2 font-medium text-gray-900">{contract.contract_number}</td>
              <td className="px-4 py-2">{getAccountName(contract.account_id)}</td>
              <td className="px-4 py-2">
                <Badge className={`${statusColors[contract.status] || 'bg-gray-200'} border-none capitalize`}>
                  {contract.status.replace('_', ' ')}
                </Badge>
              </td>
              <td className="px-4 py-2">{format(new Date(contract.start_date), 'MMM d, yyyy')}</td>
              <td className="px-4 py-2">{format(new Date(contract.end_date), 'MMM d, yyyy')}</td>
              <td className="px-4 py-2 font-semibold">{formatCurrency(contract.total_value)}</td>
              <td className="px-4 py-2 text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(contract)} className="h-8 w-8 hover:bg-gray-100">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(contract.id)} className="h-8 w-8 hover:bg-gray-100 text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}