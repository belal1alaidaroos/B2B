
import React, { useState, useEffect } from "react";
import { Lead } from "@/api/entities";
import { Quote } from "@/api/entities";
import { Communication } from "@/api/entities";
import { SystemSetting } from "@/api/entities";
import { Opportunity } from "@/api/entities";
import { User } from "@/api/entities";

import DashboardSelector from "../components/dashboard/DashboardSelector";
import SalesOverviewDashboard from "../components/dashboard/SalesOverviewDashboard";
import EmployeePerformanceDashboard from "../components/dashboard/EmployeePerformanceDashboard";

import { usePermissions } from '@/components/hooks/usePermissions';
import ProtectedComponent from '@/components/common/ProtectedComponent';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Module-level cache for system settings
let settingsCache = null;

export default function Dashboard() {
  const [selectedDashboard, setSelectedDashboard] = useState('overview');
  const [leads, setLeads] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [currency, setCurrency] = useState('AED');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { canRead } = usePermissions();

  useEffect(() => {
    if (canRead('dashboard')) {
      loadAllDashboardData();
      loadSystemSettings();
    } else {
      setIsLoading(false);
    }
  }, [canRead]);

  const loadAllDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading comprehensive dashboard data...');
      
      const [leadsData, quotesData, opportunitiesData, usersData, communicationsData] = await Promise.all([
        Lead.list("-updated_date", 100),
        Quote.list("-updated_date", 50),
        Opportunity.list("-updated_date", 100),
        User.list(),
        Communication.list("-created_date", 30)
      ]);
      
      console.log('Dashboard data loaded:', {
        leads: leadsData.length,
        quotes: quotesData.length,
        opportunities: opportunitiesData.length,
        users: usersData.length,
        communications: communicationsData.length
      });
      
      setLeads(leadsData || []);
      setQuotes(quotesData || []);
      setOpportunities(opportunitiesData || []);
      setUsers(usersData || []);
      setCommunications(communicationsData || []);
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemSettings = async () => {
    try {
      console.log("Loading system settings for dashboard...");
      
      if (!settingsCache) {
        console.log("Fetching settings from API...");
        settingsCache = await SystemSetting.list();
      } else {
        console.log("Using cached settings.");
      }
      
      const settings = settingsCache;
      const currencySetting = settings.find(s => s.key === 'default_currency');
      
      if (currencySetting && currencySetting.value) {
        setCurrency(currencySetting.value);
        console.log("Dashboard currency set to:", currencySetting.value);
      } else {
        console.log("No currency setting found, using default AED");
      }

    } catch (error) {
      console.error("Error loading system settings:", error);
    }
  };

  // Check if user can access dashboard
  if (!canRead('dashboard')) {
    return (
      <ProtectedComponent module="dashboard" action="read">
        <div className="flex items-center justify-center h-screen text-xl text-gray-600">
          You don't have permission to access the dashboard
        </div>
      </ProtectedComponent>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <Alert className="border-red-200 bg-red-50 mb-4">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <button 
            onClick={loadAllDashboardData}
            className="clay-button bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render selected dashboard
  const renderDashboard = () => {
    const commonProps = { leads, quotes, opportunities, users, communications, currency };

    switch (selectedDashboard) {
      case 'overview':
        return <SalesOverviewDashboard {...commonProps} />;
      case 'employees':
        return <EmployeePerformanceDashboard {...commonProps} />;
      case 'industries':
        return <div className="text-center py-16 text-gray-500">Industry Analysis dashboard is under development...</div>;
      case 'nationalities':
        return <div className="text-center py-16 text-gray-500">Nationality Insights dashboard is under development...</div>;
      case 'jobs':
        return <div className="text-center py-16 text-gray-500">Job Categories dashboard is under development...</div>;
      case 'financial':
        return <div className="text-center py-16 text-gray-500">Financial Performance dashboard is under development...</div>;
      default:
        return <SalesOverviewDashboard {...commonProps} />;
    }
  };

  return (
    <div className="p-4 space-y-4 min-h-screen">
      <DashboardSelector 
        selectedDashboard={selectedDashboard}
        onDashboardChange={setSelectedDashboard}
      />
      
      {renderDashboard()}
    </div>
  );
}
