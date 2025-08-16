
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, UserCheck, DollarSign, BarChart } from 'lucide-react';

const icons = {
  totalAccounts: Building2,
  activeAccounts: UserCheck,
  totalRevenue: DollarSign,
  averageRevenue: BarChart
};

const iconColors = {
  totalAccounts: 'text-blue-600 bg-blue-100',
  activeAccounts: 'text-green-600 bg-green-100',
  totalRevenue: 'text-emerald-600 bg-emerald-100',
  averageRevenue: 'text-purple-600 bg-purple-100'
};

export default function AccountStats({ stats, isLoading, currency = 'AED' }) {
  const formatCurrencyValue = (value, showK = true) => {
    const currencySymbols = {
      'AED': 'د.إ',
      'SAR': 'ر.س',  
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };

    const symbol = currencySymbols[currency] || currency; // Fallback to currency code if symbol not found
    
    if (showK) {
      // Use Math.round for consistent rounding as toFixed can sometimes have floating point issues with .5
      // Or simply keep toFixed(0) if that's the desired behavior.
      // For financial numbers, toFixed(0) is usually fine.
      return `${(value / 1000).toFixed(0)}K ${symbol}`;
    } else {
      // Ensure value is a number before toLocaleString
      return `${Number(value).toLocaleString()} ${symbol}`;
    }
  };

  const statsData = [
    { key: 'totalAccounts', label: 'Total Accounts', value: stats.totalAccounts.toLocaleString(), subtext: 'across all industries' },
    { key: 'activeAccounts', label: 'Active Accounts', value: stats.activeAccounts.toLocaleString(), subtext: 'ready for business' },
    { key: 'totalRevenue', label: 'Total Revenue', value: formatCurrencyValue(stats.totalRevenue, false), subtext: 'in active deals' },
    { key: 'averageRevenue', label: 'Avg Revenue', value: formatCurrencyValue(stats.averageRevenue), subtext: 'per account' }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="clay-card p-3 rounded-xl flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {statsData.map(stat => {
        const Icon = icons[stat.key];
        return (
          <Card key={stat.key} className="clay-card p-3 rounded-xl flex items-center gap-4 border-none hover:shadow-md transition-shadow duration-200">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColors[stat.key]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              <p className="text-xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
