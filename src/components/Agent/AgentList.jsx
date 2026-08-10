import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../store/agentStore';
import { AgentCard } from './AgentCard';
import { useUIStore } from '../../store';

export function AgentList({ onEditAgent }) {
  const { agents, isLoading, error, fetchAgents, deleteAgent } = useAgentStore();
  const { showToast } = useUIStore();
  const [selectedId, setSelectedId] = useState(null);

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
    );
  }

  return (
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
  );
}