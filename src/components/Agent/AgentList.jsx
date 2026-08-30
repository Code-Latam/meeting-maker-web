import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../store/agentStore';
import { AgentCard } from './AgentCard';
import { useUIStore, useAuthStore, useAppStore } from '../../store';
import { WebsiteModal } from './WebsiteModal';

export function AgentList({ onEditAgent }) {
  const { agents, isLoading, error, fetchAgents, deleteAgent } = useAgentStore();
  const { showToast } = useUIStore();
  const { client } = useAuthStore();
  const { activeClientId } = useAppStore();
  
  // ✅ Use activeClientId if set (agency), fallback to client._id
  const clientId = activeClientId || client?._id;
  
  const [selectedId, setSelectedId] = useState(null);
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [websiteData, setWebsiteData] = useState(null);

  // ✅ Load website data from localStorage using client ID
  useEffect(() => {
    if (clientId) {
      const savedWebsiteData = localStorage.getItem(`agentWebsiteData_${clientId}`);
      if (savedWebsiteData) {
        try {
          const parsed = JSON.parse(savedWebsiteData);
          setWebsiteData(parsed);
        } catch (e) {
          console.error('Error loading website data:', e);
        }
      } else {
        setWebsiteData(null);
      }
    }
  }, [clientId]);

  // ✅ Save website data with client ID
  const handleWebsiteDataSaved = (data) => {
    if (clientId) {
      setWebsiteData(data);
      localStorage.setItem(`agentWebsiteData_${clientId}`, JSON.stringify(data));
      showToast('✅ Company information saved!', 'success');
    }
  };

  const handleOpenWebsiteModal = () => {
    setIsWebsiteModalOpen(true);
  };

  useEffect(() => {
    fetchAgents();
  }, []);

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

  const hasCompanyInfo = websiteData && 
    (websiteData.data?.aiDescription || websiteData.description || websiteData.data?.businessServices || websiteData.services);

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
                    localStorage.removeItem(`agentWebsiteData_${clientId}`);
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
        {agents.map((agent) => (
          <AgentCard
            key={agent._id}
            agent={agent}
            onEdit={() => {
              setSelectedId(agent._id);
              onEditAgent(agent);
            }}
            onDelete={handleDelete}
            isSelected={selectedId === agent._id}
          />
        ))}
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