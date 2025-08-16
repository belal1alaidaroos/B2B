import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { 
  BarChart3, 
  Users, 
  Building2, 
  Globe, 
  Briefcase, 
  TrendingUp,
  Target,
  DollarSign
} from 'lucide-react';

const dashboardConfigs = [
  {
    id: 'overview',
    name: 'Sales Overview',
    icon: BarChart3,
    description: 'Overall sales funnel and key metrics',
    color: 'text-blue-600'
  },
  {
    id: 'employees',
    name: 'Employee Performance',
    icon: Users,
    description: 'Sales team performance analysis',
    color: 'text-emerald-600'
  },
  {
    id: 'industries',
    name: 'Industry Analysis',
    icon: Building2,
    description: 'Sales performance by industry sectors',
    color: 'text-purple-600'
  },
  {
    id: 'nationalities',
    name: 'Nationality Insights',
    icon: Globe,
    description: 'Performance and distribution by nationalities',
    color: 'text-orange-600'
  },
  {
    id: 'jobs',
    name: 'Job Categories',
    icon: Briefcase,
    description: 'Demand and performance by job categories',
    color: 'text-teal-600'
  },
  {
    id: 'financial',
    name: 'Financial Performance',
    icon: DollarSign,
    description: 'Revenue and profitability insights',
    color: 'text-green-600'
  }
];

export default function DashboardSelector({ selectedDashboard, onDashboardChange }) {
  const currentDashboard = dashboardConfigs.find(d => d.id === selectedDashboard);

  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          {currentDashboard && (
            <div className="w-12 h-12 clay-primary-gradient rounded-xl flex items-center justify-center">
              <currentDashboard.icon className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {currentDashboard?.name || 'Dashboard'}
            </h1>
            <p className="text-sm text-gray-600">
              {currentDashboard?.description || 'Select a dashboard to view data'}
            </p>
          </div>
        </div>

        <Card className="clay-card border-none p-2 min-w-72">
          <Select value={selectedDashboard} onValueChange={onDashboardChange}>
            <SelectTrigger className="border-none focus:ring-0">
              <SelectValue placeholder="Choose Dashboard" />
            </SelectTrigger>
            <SelectContent className="clay-card">
              {dashboardConfigs.map(dashboard => (
                <SelectItem key={dashboard.id} value={dashboard.id}>
                  <div className="flex items-center gap-3 py-1">
                    <dashboard.icon className={`w-4 h-4 ${dashboard.color}`} />
                    <div>
                      <div className="font-medium">{dashboard.name}</div>
                      <div className="text-xs text-gray-500">{dashboard.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      </div>
    </div>
  );
}