import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../store/agentStore';
import { AgentCard } from './AgentCard';
import { useUIStore, useAuthStore, useAppStore } from '../../store';
import { WebsiteModal } from './WebsiteModal';
import { agentsService } from '../../services/agents';

export function AgentList({ onEditAgent }) {
  const { agents, isLoading, error, fetchAgents, deleteAgent } = useAgentStore();
  const { showToast } = useUIStore();
  const { client } = useAuthStore();
  const { activeClientId } = useAppStore();
  
  const clientId = activeClientId || client?.id;
  
  const [selectedId, setSelectedId] = useState(null);
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [websiteData, setWebsiteData] = useState(null);

  // NEW: state for counts
  const [countsMap, setCountsMap] = useState({});
  const [countsLoading, setCountsLoading] = useState(false);

  console.log('🔍 [AgentList] Rendering with clientId:', clientId);

  // Load website data from localStorage
  const loadWebsiteData = () => {
    console.log('🔄 [AgentList] loadWebsiteData called');
    
    if (!clientId) {
      console.log('❌ [AgentList] No clientId available, setting websiteData to null');
      setWebsiteData(null);
      return;
    }
    
    const key = `agentWebsiteData_${clientId}`;
    console.log(`🔑 [AgentList] Looking for key: "${key}"`);
    
    const savedWebsiteData = localStorage.getItem(key);
    console.log(`📦 [AgentList] Raw data from localStorage:`, savedWebsiteData);
    
    if (savedWebsiteData) {
      try {
        const parsed = JSON.parse(savedWebsiteData);
        console.log('✅ [AgentList] Parsed data:', parsed);
        console.log('📊 [AgentList] Data structure:', {
          hasData: !!parsed,
          hasDataDotData: !!parsed?.data,
          aiDescription: parsed?.data?.aiDescription?.substring(0, 50) + '...' || 'null',
          businessServices: parsed?.data?.businessServices?.substring(0, 50) + '...' || 'null',
        });
        setWebsiteData(parsed);
      } catch (e) {
        console.error('❌ [AgentList] Error loading website data:', e);
        setWebsiteData(null);
      }
    } else {
      console.log('❌ [AgentList] No data found for key:', key);
      setWebsiteData(null);
    }
  };

  // Load data on mount and when client changes
  useEffect(() => {
    console.log('🔄 [AgentList] useEffect triggered - clientId changed or mount');
    loadWebsiteData();
  }, [clientId]);

  // Reload when modal closes
  useEffect(() => {
    console.log('🔄 [AgentList] Modal state changed - isOpen:', isWebsiteModalOpen);
    if (!isWebsiteModalOpen) {
      loadWebsiteData();
    }
  }, [isWebsiteModalOpen]);

  // Save website data with client ID
  const handleWebsiteDataSaved = (data) => {
    console.log('💾 [AgentList] handleWebsiteDataSaved called with data:', data);
    if (clientId) {
      const key = `agentWebsiteData_${clientId}`;
      console.log(`💾 [AgentList] Saving to key: "${key}"`);
      localStorage.setItem(key, JSON.stringify(data));
      console.log('✅ [AgentList] Data saved to localStorage');
      setWebsiteData(data);
      showToast('✅ Company information saved!', 'success');
    } else {
      console.log('❌ [AgentList] No clientId available, cannot save');
    }
  };

  const handleOpenWebsiteModal = () => {
    console.log('🔄 [AgentList] Opening WebsiteModal');
    setIsWebsiteModalOpen(true);
  };

  useEffect(() => {
    console.log('🔄 [AgentList] Fetching agents...');
    fetchAgents();
  }, []);

  // NEW: Fetch counts whenever agents change
  useEffect(() => {
    if (agents.length === 0) {
      setCountsMap({});
      return;
    }

    const fetchCounts = async () => {
      setCountsLoading(true);
      try {
        const [leadRes, emailRes, articleRes] = await Promise.all([
          agentsService.getLeadCounts(),
          agentsService.getEmailLeadCounts(),
          agentsService.getArticleCounts(),
        ]);

        const newMap = {};
        agents.forEach(agent => {
          const agentId = agent._id;
          const linkedin = leadRes.success ? (leadRes.counts[agentId] || 0) : 0;
          const email = emailRes.success ? (emailRes.counts[agentId] || 0) : 0;
          const articles = articleRes.success ? (articleRes.counts[agentId] || 0) : 0;
          newMap[agentId] = { linkedin, email, articles };
        });
        setCountsMap(newMap);
      } catch (error) {
        console.error('Failed to fetch agent counts:', error);
      } finally {
        setCountsLoading(false);
      }
    };

    fetchCounts();
  }, [agents]);

  const handleDelete = async (agent) => {
    if (window.confirm(`Are you sure you want to delete "${agent.name}"?`)) {
      const result = await deleteAgent(agent._id);
      if (result.success) {
        showToast('Agent deleted successfully', 'success');
      } else {
        showToast(result.error || 'Failed to delete agent', 'error');
      }
    }
  };

  // Check if website data exists for this client
  const hasCompanyInfo = websiteData && 
    (websiteData.data?.aiDescription || websiteData.description || websiteData.data?.businessServices || websiteData.services);

  console.log('🏢 [AgentList] hasCompanyInfo:', hasCompanyInfo);
  console.log('📊 [AgentList] websiteData:', websiteData);

  if (isLoading && agents.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-gray-500">{error}</p>
        <button 
          onClick={() => fetchAgents()}
          className="btn-secondary mt-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <>
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">🏢 Company Information</h3>
            <p className="text-sm text-gray-500">
              {hasCompanyInfo 
                ? '✅ Company information has been added' 
                : 'Add your company information for better agent generation'}
            </p>
          </div>
          <button
            onClick={handleOpenWebsiteModal}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            {hasCompanyInfo ? '📝 Edit Company Info' : '+ Add Company Info'}
          </button>
        </div>

        <div className="text-center py-12">
          <div className="text-5xl mb-4">🤖</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Agents Found</h3>
          <p className="text-gray-500 text-sm mb-4">Create your first agent to get started</p>
          <button 
            onClick={() => onEditAgent(null)}
            className="btn-primary"
          >
            + Create Agent
          </button>
        </div>

        <WebsiteModal
          isOpen={isWebsiteModalOpen}
          onClose={() => setIsWebsiteModalOpen(false)}
          onSave={handleWebsiteDataSaved}
          existingData={websiteData}
        />
      </>
    );
  }

  return (
    <>
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700">🏢 Company Information</h3>
          <p className="text-sm text-gray-500">
            {hasCompanyInfo 
              ? '✅ Company information has been added' 
              : 'Add your company information for better agent generation'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasCompanyInfo && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear the company information for this client?')) {
                  if (clientId) {
                    const key = `agentWebsiteData_${clientId}`;
                    console.log(`🗑️ [AgentList] Clearing data for key: "${key}"`);
                    localStorage.removeItem(key);
                    setWebsiteData(null);
                    showToast('✅ Company information cleared', 'success');
                  }
                }
              }}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              🗑️ Clear
            </button>
          )}
          <button
            onClick={handleOpenWebsiteModal}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            {hasCompanyInfo ? '📝 Edit Company Info' : '+ Add Company Info'}
          </button>
        </div>
      </div>

      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-3">
        {agents.map((agent) => {
          const counts = countsMap[agent._id] || { linkedin: 0, email: 0, articles: 0 };
          return (
            <AgentCard
              key={agent._id}
              agent={agent}
              onEdit={() => {
                setSelectedId(agent._id);
                onEditAgent(agent);
              }}
              onDelete={handleDelete}
              isSelected={selectedId === agent._id}
              linkedinCount={counts.linkedin}
              emailCount={counts.email}
              articleCount={counts.articles}
            />
          );
        })}
      </div>

      <WebsiteModal
        isOpen={isWebsiteModalOpen}
        onClose={() => setIsWebsiteModalOpen(false)}
        onSave={handleWebsiteDataSaved}
        existingData={websiteData}
      />
    </>
  );
}