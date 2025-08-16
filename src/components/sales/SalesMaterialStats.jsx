import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Clock,
  Users,
  BarChart3
} from 'lucide-react';

export default function SalesMaterialStats({ materials, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="clay-card border-none">
            <CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalMaterials = materials.length;
  const totalDownloads = materials.reduce((sum, material) => sum + (material.download_count || 0), 0);
  const activeMaterials = materials.filter(m => m.status === 'active').length;
  const recentMaterials = materials.filter(m => {
    const createdDate = new Date(m.created_date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdDate > sevenDaysAgo;
  }).length;

  const stats = [
    {
      title: 'Total Materials',
      value: totalMaterials.toString(),
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Active Materials',
      value: activeMaterials.toString(),
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      title: 'Total Downloads',
      value: totalDownloads.toString(),
      icon: Download,
      color: 'purple'
    },
    {
      title: 'Added This Week',
      value: recentMaterials.toString(),
      icon: Clock,
      color: 'orange'
    }
  ];

  const colorMap = {
    blue: 'text-blue-600 bg-blue-100',
    emerald: 'text-emerald-600 bg-emerald-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="clay-card border-none hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[stat.color]}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}