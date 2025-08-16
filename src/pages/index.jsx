import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import PricingEngine from "./PricingEngine";

import LeadsPipeline from "./LeadsPipeline";

import Communications from "./Communications";

import Quotes from "./Quotes";

import Accounts from "./Accounts";

import Contacts from "./Contacts";

import Users from "./Users";

import Settings from "./Settings";

import Profile from "./Profile";

import Jobs from "./Jobs";

import Roles from "./Roles";

import UserDetail from "./UserDetail";

import Departments from "./Departments";

import Branches from "./Branches";

import Countries from "./Countries";

import Cities from "./Cities";

import Territories from "./Territories";

import CostComponents from "./CostComponents";

import PricingRules from "./PricingRules";

import Nationalities from "./Nationalities";

import JobProfiles from "./JobProfiles";

import PriceRequests from "./PriceRequests";

import SkillLevels from "./SkillLevels";

import QuoteCreator from "./QuoteCreator";

import StaffInteractions from "./StaffInteractions";

import Opportunities from "./Opportunities";

import Tasks from "./Tasks";

import CustomerInteractions from "./CustomerInteractions";

import Notifications from "./Notifications";

import Forecasting from "./Forecasting";

import CommunicationAnalytics from "./CommunicationAnalytics";

import DiscountApprovalRules from "./DiscountApprovalRules";

import DiscountApprovers from "./DiscountApprovers";

import Contracts from "./Contracts";

import SalesEnablement from "./SalesEnablement";

import AuditLogs from "./AuditLogs";

import AuthTest from "./AuthTest";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    PricingEngine: PricingEngine,
    
    LeadsPipeline: LeadsPipeline,
    
    Communications: Communications,
    
    Quotes: Quotes,
    
    Accounts: Accounts,
    
    Contacts: Contacts,
    
    Users: Users,
    
    Settings: Settings,
    
    Profile: Profile,
    
    Jobs: Jobs,
    
    Roles: Roles,
    
    UserDetail: UserDetail,
    
    Departments: Departments,
    
    Branches: Branches,
    
    Countries: Countries,
    
    Cities: Cities,
    
    Territories: Territories,
    
    CostComponents: CostComponents,
    
    PricingRules: PricingRules,
    
    Nationalities: Nationalities,
    
    JobProfiles: JobProfiles,
    
    PriceRequests: PriceRequests,
    
    SkillLevels: SkillLevels,
    
    QuoteCreator: QuoteCreator,
    
    StaffInteractions: StaffInteractions,
    
    Opportunities: Opportunities,
    
    Tasks: Tasks,
    
    CustomerInteractions: CustomerInteractions,
    
    Notifications: Notifications,
    
    Forecasting: Forecasting,
    
    CommunicationAnalytics: CommunicationAnalytics,
    
    DiscountApprovalRules: DiscountApprovalRules,
    
    DiscountApprovers: DiscountApprovers,
    
    Contracts: Contracts,
    
    SalesEnablement: SalesEnablement,
    
    AuditLogs: AuditLogs,
    
    AuthTest: AuthTest,
    
};

export const hashPageNames = ["leads-pipeline", "quote-creator", "staff-interactions", "customer-interactions", "communication-analytics", "discount-approval-rules", "discount-approvers", "sales-enablement", "audit-logs", "cost-components", "pricing-rules", "job-profiles", "price-requests", "skill-levels", "user-detail", "auth-test"];

function getCurrentPageName() {
    const currentUrl = window.location.href;
    const urlObject = new URL(currentUrl);
    const hash = urlObject.hash;
    const search = urlObject.search;
    const urlLastPart = urlObject.pathname.split('/').pop();

    // Priority 1: Check for hash-based routing
    if (hash) {
        let hashValue = hash.substring(1).toLowerCase();
        
        // Handle hash with query parameters
        if (hashValue.includes('?')) {
            hashValue = hashValue.split('?')[0];
        }
        
        if (hashPageNames.includes(hashValue)) {
            // Convert kebab-case to PascalCase
            return hashValue.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
        }
    }

    // Priority 2: Check for query parameter based routing
    if (search) {
        const params = new URLSearchParams(search);
        const page = params.get('page');
        if (page && Object.keys(PAGES).includes(page)) {
            return page;
        }
    }

    // Priority 3: Check for path-based routing
    if (urlLastPart && urlLastPart !== '' && urlLastPart !== 'index.html') {
        // Handle kebab-case URLs
        if (hashPageNames.includes(urlLastPart.toLowerCase())) {
            return urlLastPart.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
        }
        
        // Handle exact match
        if (Object.keys(PAGES).includes(urlLastPart)) {
            return urlLastPart;
        }
        
        // Handle case-insensitive match
        const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
        return pageName || Object.keys(PAGES)[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

export default function Pages() {
    return (
        <Router>
            <Routes>
                <Route path="*" element={<LayoutWithPageDetection />} />
            </Routes>
        </Router>
    );
}

function LayoutWithPageDetection() {
    const location = useLocation();
    const currentPageName = getCurrentPageName();
    const CurrentPageComponent = PAGES[currentPageName];

    return (
        <Layout currentPageName={currentPageName}>
            {CurrentPageComponent ? <CurrentPageComponent /> : <Dashboard />}
        </Layout>
    );
}