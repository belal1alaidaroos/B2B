import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, DollarSign } from "lucide-react";

const categoryColors = {
  construction: 'bg-orange-100 text-orange-800',
  hospitality: 'bg-pink-100 text-pink-800',
  healthcare: 'bg-green-100 text-green-800',
  manufacturing: 'bg-blue-100 text-blue-800',
  logistics: 'bg-purple-100 text-purple-800',
  technical: 'bg-indigo-100 text-indigo-800',
  administrative: 'bg-gray-100 text-gray-800',
  other: 'bg-yellow-100 text-yellow-800'
};

export default function JobSelector({ jobProfiles = [], selectedJob, onJobSelect, isLoading }) {
  if (isLoading) {
    return (
      <Card className="clay-card border-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Select Job Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle case where no job profiles are available
  if (!jobProfiles || jobProfiles.length === 0) {
    return (
      <Card className="clay-card border-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            Select Job Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No job profiles available</p>
            <p className="text-sm">Create some job profiles to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="clay-card border-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-emerald-600" />
          Select Job Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={selectedJob?.id || ''}
          onValueChange={(value) => {
            const job = jobProfiles.find(j => j.id === value);
            if (onJobSelect) {
              onJobSelect(job);
            }
          }}
        >
          <SelectTrigger className="clay-element border-none h-12 text-left">
            <SelectValue placeholder="Choose a job profile..." />
          </SelectTrigger>
          <SelectContent className="clay-card border-none">
            {jobProfiles.map((job) => (
              <SelectItem key={job.id} value={job.id} className="p-3 hover:bg-white/50 rounded-xl">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{job.job_title}</span>
                  <span className="text-sm text-gray-500">${job.base_cost}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedJob && (
          <div className="space-y-4 p-4 clay-element">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Category</span>
              <Badge className={`${categoryColors[selectedJob.category] || categoryColors.other} border-none rounded-xl`}>
                {selectedJob.category}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Skill Level</span>
              <Badge variant="outline" className="rounded-xl border-emerald-200 text-emerald-700">
                {selectedJob.skill_level}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Base Cost</span>
              <div className="flex items-center gap-1 font-semibold text-gray-800">
                <DollarSign className="w-4 h-4" />
                {selectedJob.base_cost}/month
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}