import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { Login } from './pages/Login';
import { HelpPage } from './pages/HelpPage';
import { InvoicePage } from './pages/InvoicePage'; // ✅ ADD THIS
import { useAuthStore } from './store';
import { AgentsTab } from './components/Tabs/AgentsTab';
import { DashboardTab } from './pages/DashboardTab';
import { BoostTab } from './components/Tabs/BoostTab';
import { RankingTab } from './components/Tabs/RankingTab';
import { CRMTab } from './components/Tabs/CRMTab';
import { AboutTab } from './components/Tabs/AboutTab';
import { GroupsPerformancePage } from './pages/GroupsPerformancePage';
import { PersonsPage } from './pages/PersonsPage';
import { AgentCampaignsPage } from './pages/AgentCampaignsPage';
import { MarketingCampaignsPage } from './pages/MarketingCampaignsPage';
import { ActivityTab } from './components/Activity/ActivityTab'; 

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/invoice" element={<InvoicePage />} />
      <Route path="/" element={<AppLayout />}>
        {/* Main Tabs */}
        <Route index element={<AgentsTab />} />
        <Route path="activity" element={<ActivityTab />} /> 
        <Route path="dashboard" element={<DashboardTab />} />
        <Route path="boost" element={<BoostTab />} />
        <Route path="ranking" element={<RankingTab />} />
        <Route path="crm" element={<CRMTab />} />
        <Route path="about" element={<AboutTab />} />
        
        {/* Agent Detail Pages */}
        <Route path="agents/:agentId/persons" element={<PersonsPage />} />
        <Route path="agents/:agentId/campaigns" element={<AgentCampaignsPage />} />
        <Route path="agents/:agentId/marketing" element={<MarketingCampaignsPage />} />
        
        {/* Dashboard Pages */}
        <Route path="groups-performance" element={<GroupsPerformancePage />} />
      </Route>
    </Routes>
  );
}

export default App;