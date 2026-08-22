import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { Login } from './pages/Login';
import { HelpPage } from './pages/HelpPage';
import { InvoicePage } from './pages/InvoicePage';
import { Agency } from './pages/Agency';
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
import { ConversionsTab } from './components/Tabs/ConversionsTab';
// ✅ Import BlogSettingsPage
import { BlogSettingsPage } from './pages/BlogSettingsPage';

// ✅ Route Guard for child clients using isChildClient from store
const ChildClientGuard = ({ children }) => {
  const { isChildClient } = useAuthStore();
  
  if (isChildClient) {
    // Redirect child clients away from restricted pages
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    console.log('🔍 App - Running checkAuth...');
    checkAuth();
  }, [checkAuth]);

  // ✅ Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/invoice" element={<InvoicePage />} />
      
      {/* ✅ Protected routes - wrapped with authentication check */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />
        }
      >
        {/* ✅ Agents - blocked for child clients */}
        <Route 
          index 
          element={
            <ChildClientGuard>
              <AgentsTab />
            </ChildClientGuard>
          } 
        />
        
        {/* ✅ Activity - visible to all */}
        <Route path="activity" element={<ActivityTab />} /> 
        
        {/* ✅ Dashboard - visible to all (redirect target for child clients) */}
        <Route path="dashboard" element={<DashboardTab />} />
        
        {/* ✅ Boost - visible to all */}
        <Route path="boost" element={<BoostTab />} />
        
        {/* ✅ Ranking - blocked for child clients */}
        <Route 
          path="ranking" 
          element={
            <ChildClientGuard>
              <RankingTab />
            </ChildClientGuard>
          } 
        />
        
        {/* ✅ CRM - visible to all */}
        <Route path="crm" element={<CRMTab />} />
        
        {/* ✅ About - blocked for child clients */}
        <Route 
          path="about" 
          element={
            <ChildClientGuard>
              <AboutTab />
            </ChildClientGuard>
          } 
        />

        {/* ✅ Conversions - visible to all */}
        <Route path="conversions" element={<ConversionsTab />} />
        
        {/* ✅ Agency Route - only visible to agency users (handled inside component) */}
        <Route path="agency" element={<Agency />} />
        
        {/* ✅ Blog Settings Route - visible to all (child clients can see blog) */}
        <Route path="blog" element={<BlogSettingsPage />} />
        
        {/* ✅ Agent Detail Pages - all blocked for child clients */}
        <Route 
          path="agents/:agentId/persons" 
          element={
            <ChildClientGuard>
              <PersonsPage />
            </ChildClientGuard>
          } 
        />
        <Route 
          path="agents/:agentId/campaigns" 
          element={
            <ChildClientGuard>
              <AgentCampaignsPage />
            </ChildClientGuard>
          } 
        />
        <Route 
          path="agents/:agentId/marketing" 
          element={
            <ChildClientGuard>
              <MarketingCampaignsPage />
            </ChildClientGuard>
          } 
        />
        
        {/* ✅ Groups Performance - visible to all */}
        <Route path="groups-performance" element={<GroupsPerformancePage />} />
      </Route>
      
      {/* ✅ Catch-all redirect */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
    </Routes>
  );
}

export default App;