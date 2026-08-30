import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../store/agentStore';
import { AgentCard } from './AgentCard';
import { useUIStore } from '../../store';
import { WebsiteModal } from './WebsiteModal';

export function AgentList({ onEditAgent }) {
  const { agents, isLoading, error, fetchAgents, deleteAgent } = useAgentStore();
  const { showToast } = useUIStore();
  const [selectedId, setSelectedId] = useState(null);
  
  // ✅ Website Modal state
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [websiteData, setWebsiteData] = useState(null);

  // Load website data from localStorage on mount
  useEffect(() => {
    const savedWebsiteData = localStorage.getItem('agentWebsiteData');
    if (savedWebsiteData) {
      try {
        const parsed = JSON.parse(savedWebsiteData);
        setWebsiteData(parsed);
      } catch (e) {
        console.error('Error loading website data:', e);
      }
    }
  }, []);

  // Handle website data from modal
  const handleWebsiteDataSaved = (data) => {
    setWebsiteData(data);
    localStorage.setItem('agentWebsiteData', JSON.stringify(data));
    showToast('✅ Company information saved!', 'success');
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

  // ✅ Check if website data exists
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

  return (
    <>
      {/* ✅ Company Info Header */}
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

      {/* Agents Grid */}
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

      {/* ✅ Website Modal */}
      <WebsiteModal
        isOpen={isWebsiteModalOpen}
        onClose={() => setIsWebsiteModalOpen(false)}
        onSave={handleWebsiteDataSaved}
        existingData={websiteData}
      />
    </>
  );
}