

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { User } from '@/api/entities';
import {
  LayoutDashboard, Users as UsersIcon, Target, Building, User as UserIcon,
  FileText, Briefcase, Calculator, DollarSign, Settings, Bell,
  ChevronDown, Menu, X, ListTodo, TrendingUp, FileSignature, Shield,
  Plane, CreditCard, ReceiptText, Wallet, Currency
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePermissions } from '@/components/hooks/usePermissions';
import { Badge } from "@/components/ui/badge";
import NotificationBell from './components/notifications/NotificationBell';

// Navigation arrays
const mainMenuNav = [
  { to: createPageUrl('Dashboard'), icon: LayoutDashboard, label: 'Dashboard' },
  { to: createPageUrl('Forecasting'), icon: TrendingUp, label: 'Forecasting' },
  { to: createPageUrl('LeadsPipeline'), icon: UsersIcon, label: 'Leads Pipeline' },
  { to: createPageUrl('Opportunities'), icon: Target, label: 'Opportunities' },
  { to: createPageUrl('Accounts'), icon: Building, label: 'Accounts' },
  { to: createPageUrl('Contacts'), icon: UserIcon, label: 'Contacts' },
  { to: createPageUrl('Tasks'), icon: ListTodo, label: 'Task Management' },
  { to: createPageUrl('Quotes'), icon: FileText, label: 'Quotes' },
  { to: createPageUrl('Contracts'), icon: FileSignature, label: 'Contracts' },
  { to: createPageUrl('Jobs'), icon: Briefcase, label: 'Jobs' },
  { to: createPageUrl('PriceRequests'), icon: Calculator, label: 'Price Requests' },
  { to: createPageUrl('PricingEngine'), icon: DollarSign, label: 'Pricing Engine' },
  { to: createPageUrl('TravelManagement'), icon: Plane, label: 'Travel Management' }, // New
  { to: createPageUrl('Expenses'), icon: CreditCard, label: 'Expenses' }, // New
];

const salesSupportNav = [
  { to: createPageUrl('SalesEnablement'), icon: FileText, label: 'Sales Materials Library' }
];

const communicationNav = [
  { to: createPageUrl('Communications'), icon: FileText, label: 'Communications Log' },
  { to: createPageUrl('CustomerInteractions'), icon: UsersIcon, label: 'Customer Interactions' },
  { to: createPageUrl('StaffInteractions'), icon: UserIcon, label: 'Staff Interactions' },
  { to: createPageUrl('CommunicationAnalytics'), icon: Target, label: 'Communication Analytics' }
];

const setupNav = [
  { to: createPageUrl('Users'), icon: UsersIcon, label: 'Users' },
  { to: createPageUrl('Roles'), icon: Settings, label: 'Roles & Permissions' },
  { to: createPageUrl('Departments'), icon: Building, label: 'Departments' },
  { to: createPageUrl('Branches'), icon: Building, label: 'Branches' },
  { to: createPageUrl('Countries'), icon: Building, label: 'Countries' },
  { to: createPageUrl('Cities'), icon: Building, label: 'Cities' },
  { to: createPageUrl('Territories'), icon: Building, label: 'Territories' },
  { to: createPageUrl('CostComponents'), icon: Calculator, label: 'Cost Components' },
  { to: createPageUrl('PricingRules'), icon: Settings, label: 'Pricing Rules' },
  { to: createPageUrl('Nationalities'), icon: UserIcon, label: 'Nationalities' },
  { to: createPageUrl('JobProfiles'), icon: Briefcase, label: 'Job Profiles' },
  { to: createPageUrl('SkillLevels'), icon: Target, label: 'Skill Levels' },
  { to: createPageUrl('DiscountApprovalRules'), icon: FileText, label: 'Discount Approval Rules' },
  { to: createPageUrl('DiscountApprovers'), icon: UsersIcon, label: 'Discount Approvers' },
  { to: createPageUrl('PaymentTerms'), icon: ReceiptText, label: 'Payment Terms' }, // New
  { to: createPageUrl('PaymentMethods'), icon: Wallet, label: 'Payment Methods' }, // New
  { to: createPageUrl('ExchangeRates'), icon: Currency, label: 'Exchange Rates' }, // New
  { to: createPageUrl('CurrencySettings'), icon: Settings, label: 'Currency Settings' }, // New
  { to: createPageUrl('Notifications'), icon: Bell, label: 'Notifications' },
  { to: createPageUrl('AuditLogs'), icon: Shield, label: 'Audit Logs' },
  { to: createPageUrl('Settings'), icon: Settings, label: 'System Settings' }
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    communication: false,
    setup: false,
    sales_support: false
  });
  const location = useLocation();
  const { canRead } = usePermissions();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.log('User not authenticated');
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filter navigation items based on permissions
  const getFilteredNavItems = (navItems) => {
    return navItems.filter(item => {
      const pageName = item.to.split('?')[0].split('/').pop();
      const moduleMap = {
        'Dashboard': 'dashboard',
        'Forecasting': 'forecasting',
        'LeadsPipeline': 'leads',
        'Opportunities': 'opportunities',
        'Tasks': 'tasks',
        'Accounts': 'accounts',
        'Contacts': 'contacts',
        'Quotes': 'quotes',
        'Contracts': 'contracts',
        'Jobs': 'jobs',
        'PriceRequests': 'price_requests',
        'PricingEngine': 'pricing_engine',
        'TravelManagement': 'travel_management', // New
        'Expenses': 'expenses', // New
        'SalesEnablement': 'sales_enablement',
        'Communications': 'communications',
        'CustomerInteractions': 'communications',
        'StaffInteractions': 'communications',
        'CommunicationAnalytics': 'communications',
        'Users': 'users',
        'Roles': 'roles',
        'Departments': 'departments',
        'Branches': 'branches',
        'Countries': 'countries',
        'Cities': 'cities',
        'Territories': 'terp_territories',
        'CostComponents': 'cost_components',
        'PricingRules': 'pricing_rules',
        'Nationalities': 'nationalities',
        'JobProfiles': 'job_profiles',
        'SkillLevels': 'skill_levels',
        'DiscountApprovalRules': 'discount_approval_matrix',
        'DiscountApprovers': 'discount_approval_matrix',
        'PaymentTerms': 'payment_terms', // New
        'PaymentMethods': 'payment_methods', // New
        'ExchangeRates': 'exchange_rates', // New
        'CurrencySettings': 'currency_settings', // New
        'Notifications': 'notifications',
        'AuditLogs': 'audit_logs',
        'Settings': 'settings'
      };

      const module = moduleMap[pageName];
      return module ? canRead(module) : true;
    });
  };

  const filteredMainNav = getFilteredNavItems(mainMenuNav);
  const filteredSalesSupportNav = getFilteredNavItems(salesSupportNav);
  const filteredCommunicationNav = getFilteredNavItems(communicationNav);
  const filteredSetupNav = getFilteredNavItems(setupNav);

  const renderNavItem = (item) => {
    const IconComponent = item.icon;
    const isActive = location.pathname === item.to || location.pathname === item.to + '/';

    return (
      <Link
        key={item.to}
        to={item.to}
        className={`flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 group ${
          isActive
            ? 'clay-primary-gradient text-white shadow-md'
            : 'text-gray-600 hover:bg-clay-100 hover:text-clay-700'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      >
        <IconComponent className={`h-5 w-5 mr-3 transition-colors ${
          isActive ? 'text-white' : 'text-gray-500 group-hover:text-clay-600'
        }`} />
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  const renderNavSection = (title, items, sectionKey) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-clay-700 transition-colors"
        >
          <span>{title}</span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
            expandedSections[sectionKey] ? 'rotate-180' : ''
          }`} />
        </button>
        {expandedSections[sectionKey] && (
          <div className="mt-2 space-y-1">
            {items.map(renderNavItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 clay-primary-gradient">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
                <span className="text-clay-600 font-bold text-lg">C</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">ClayStaff</h1>
                <p className="text-clay-100 text-xs">CRM System</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-white hover:bg-clay-700 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {renderNavSection("Main Menu", filteredMainNav, "main")}
            {renderNavSection("Sales Support", filteredSalesSupportNav, "sales_support")}
            {renderNavSection("Communication", filteredCommunicationNav, "communication")}
            {renderNavSection("System Setup", filteredSetupNav, "setup")}
          </div>

          {/* User Menu */}
          {user && (
            <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start px-2 py-2 h-auto hover:bg-gray-100">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="clay-primary-gradient text-white text-sm font-medium">
                          {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.full_name || 'User'}</p>
                        <div className="flex items-center space-x-1">
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          {user.role === 'admin' && (
                            <Badge variant="secondary" className="text-xs py-0 px-1">Admin</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Profile')} className="cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {canRead('settings') && (
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Settings')} className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {currentPageName?.replace(/([A-Z])/g, ' $1').trim() || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationBell />
              {user && (
                <div className="hidden md:flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="clay-primary-gradient text-white text-sm font-medium">
                      {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user.role === 'admin' ? 'Administrator' : 'User'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Custom Clay Staff Theme CSS */}
      <style jsx global>{`
        .clay-primary-gradient {
          background: linear-gradient(135deg, #8B5A3C 0%, #A0724E 100%);
        }
        .clay-secondary-gradient {
          background: linear-gradient(135deg, #6B4423 0%, #8B5A3C 100%);
        }
        .clay-100 { background-color: #F5F1EC; }
        .clay-600 { color: #8B5A3C; }
        .clay-700 { color: #6B4423; }
        .clay-card {
          background: white;
          border: 1px solid #E5E7EB;
          box-shadow: 0 4px 6px -1px rgba(139, 90, 60, 0.1), 0 2px 4px -1px rgba(139, 90, 60, 0.06);
        }
      `}</style>
    </div>
  );
}

