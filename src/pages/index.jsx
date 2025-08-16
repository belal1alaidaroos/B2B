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

import DiscountApprovalRules from "./DiscountApprovalRules";

import DiscountApprovers from "./DiscountApprovers";

import Notifications from "./Notifications";

import CustomerInteractions from "./CustomerInteractions";

import StaffInteractions from "./StaffInteractions";

import CommunicationAnalytics from "./CommunicationAnalytics";

import Opportunities from "./Opportunities";

import Tasks from "./Tasks";

import Forecasting from "./Forecasting";

import Contracts from "./Contracts";

import SalesEnablement from "./SalesEnablement";

import AuditLogs from "./AuditLogs";

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
    
    DiscountApprovalRules: DiscountApprovalRules,
    
    DiscountApprovers: DiscountApprovers,
    
    Notifications: Notifications,
    
    CustomerInteractions: CustomerInteractions,
    
    StaffInteractions: StaffInteractions,
    
    CommunicationAnalytics: CommunicationAnalytics,
    
    Opportunities: Opportunities,
    
    Tasks: Tasks,
    
    Forecasting: Forecasting,
    
    Contracts: Contracts,
    
    SalesEnablement: SalesEnablement,
    
    AuditLogs: AuditLogs,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/PricingEngine" element={<PricingEngine />} />
                
                <Route path="/LeadsPipeline" element={<LeadsPipeline />} />
                
                <Route path="/Communications" element={<Communications />} />
                
                <Route path="/Quotes" element={<Quotes />} />
                
                <Route path="/Accounts" element={<Accounts />} />
                
                <Route path="/Contacts" element={<Contacts />} />
                
                <Route path="/Users" element={<Users />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Jobs" element={<Jobs />} />
                
                <Route path="/Roles" element={<Roles />} />
                
                <Route path="/UserDetail" element={<UserDetail />} />
                
                <Route path="/Departments" element={<Departments />} />
                
                <Route path="/Branches" element={<Branches />} />
                
                <Route path="/Countries" element={<Countries />} />
                
                <Route path="/Cities" element={<Cities />} />
                
                <Route path="/Territories" element={<Territories />} />
                
                <Route path="/CostComponents" element={<CostComponents />} />
                
                <Route path="/PricingRules" element={<PricingRules />} />
                
                <Route path="/Nationalities" element={<Nationalities />} />
                
                <Route path="/JobProfiles" element={<JobProfiles />} />
                
                <Route path="/PriceRequests" element={<PriceRequests />} />
                
                <Route path="/SkillLevels" element={<SkillLevels />} />
                
                <Route path="/QuoteCreator" element={<QuoteCreator />} />
                
                <Route path="/DiscountApprovalRules" element={<DiscountApprovalRules />} />
                
                <Route path="/DiscountApprovers" element={<DiscountApprovers />} />
                
                <Route path="/Notifications" element={<Notifications />} />
                
                <Route path="/CustomerInteractions" element={<CustomerInteractions />} />
                
                <Route path="/StaffInteractions" element={<StaffInteractions />} />
                
                <Route path="/CommunicationAnalytics" element={<CommunicationAnalytics />} />
                
                <Route path="/Opportunities" element={<Opportunities />} />
                
                <Route path="/Tasks" element={<Tasks />} />
                
                <Route path="/Forecasting" element={<Forecasting />} />
                
                <Route path="/Contracts" element={<Contracts />} />
                
                <Route path="/SalesEnablement" element={<SalesEnablement />} />
                
                <Route path="/AuditLogs" element={<AuditLogs />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}