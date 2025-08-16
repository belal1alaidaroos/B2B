
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Edit, Trash2, Calendar, Users, Briefcase, MoreVertical, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import ProtectedComponent from '@/components/common/ProtectedComponent';

const statusColors = {
  pending: 'bg-orange-100 text-orange-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function JobList({ jobs, accounts, viewMode, onEdit, onDelete }) {
  const getAccountName = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.company_name : 'Unknown Account';
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-800">No jobs found</h3>
        <p className="text-sm text-gray-500 mt-1">Create a new job to get started.</p>
      </div>
    );
  }

  if (viewMode === 'table') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase border-b border-gray-200/50">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Job Title</th>
              <th scope="col" className="px-4 py-3 font-medium">Client</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Start Date</th>
              <th scope="col" className="px-4 py-3 font-medium">End Date</th>
              <th scope="col" className="px-4 py-3 font-medium text-center">Personnel</th>
              <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50/50 border-b border-gray-200/30">
                <td className="px-4 py-3 font-medium text-gray-800">{job.job_title}</td>
                <td className="px-4 py-3">{getAccountName(job.account_id)}</td>
                <td className="px-4 py-3">
                  <Badge className={`border-none rounded-xl capitalize ${statusColors[job.status] || 'bg-gray-100 text-gray-800'}`}>
                    {job.status.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-4 py-3">{job.start_date ? format(new Date(job.start_date), 'd MMM, yyyy') : 'N/A'}</td>
                <td className="px-4 py-3">{job.end_date ? format(new Date(job.end_date), 'd MMM, yyyy') : 'Ongoing'}</td>
                <td className="px-4 py-3 text-center font-medium">{job.number_of_personnel}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <ProtectedComponent module="jobs" action="read" showAlert={false}>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(job)} className="h-8 w-8 hover:bg-white/50" title="View / Edit Job">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </ProtectedComponent>
                    <ProtectedComponent module="jobs" action="delete" showAlert={false}>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(job.id)} className="h-8 w-8 hover:bg-white/50 text-red-500" title="Delete Job">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </ProtectedComponent>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Grid View
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-2">
      {jobs.map(job => (
        <Card key={job.id} className="clay-card border-none hover:shadow-md transition-shadow duration-200 group">
          <CardContent className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 clay-button flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-gray-800 truncate" title={job.job_title}>{job.job_title}</h3>
                   <Badge className={`border-none rounded-md capitalize ${statusColors[job.status] || 'bg-gray-100 text-gray-800'}`}>
                    {job.status.replace('_', ' ')}
                   </Badge>
                </div>
              </div>
              <div className="flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <ProtectedComponent module="jobs" action="read" showAlert={false}>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(job)} className="h-7 w-7 hover:bg-white/50" title="View / Edit Job">
                            <Eye className="w-4 h-4" />
                        </Button>
                    </ProtectedComponent>
                    <ProtectedComponent module="jobs" action="delete" showAlert={false}>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(job.id)} className="h-7 w-7 hover:bg-white/50 text-red-500" title="Delete Job">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </ProtectedComponent>
                  </div>
              </div>
            </div>
            
            <div className="space-y-1.5 text-xs text-gray-600 my-3">
               <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="truncate font-medium text-gray-700">{getAccountName(job.account_id)}</span>
               </div>
               <div className="flex items-center gap-2">
                 <Calendar className="w-3.5 h-3.5" />
                 <span>{job.start_date ? format(new Date(job.start_date), 'd MMM, yyyy') : 'N/A'} - {job.end_date ? format(new Date(job.end_date), 'd MMM, yyyy') : 'Ongoing'}</span>
               </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5" />
                <span>{job.number_of_personnel} personnel</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
