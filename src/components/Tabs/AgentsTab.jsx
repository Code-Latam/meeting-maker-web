import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AgentList } from '../Agent/AgentList';
import { AgentForm } from '../Agent/AgentForm';
import { BottomSheet } from '../Common/BottomSheet';
import { useUIStore } from '../../store';
import { agentsService } from '../../services/agents';

export function AgentsTab() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const { showToast } = useUIStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleEditAgent = (agent) => {
    setEditingAgent(agent);
    setIsFormOpen(true);
  };

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAgent(null);
  };

  const handleSuccess = () => {
    // AgentList will auto-refresh via the store
  };

  // Auto-open an agent's edit sheet when arriving via /?agent=<id>
  useEffect(() => {
    const agentId = searchParams.get('agent');
    if (!agentId) return;
    agentsService.getAgent(agentId).then((result) => {
      if (result.success && result.agent) {
        handleEditAgent(result.agent);
      }
      setSearchParams({}, { replace: true });
    });
  }, [searchParams]);

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">🤖 Agents</h2>
        <button
          onClick={handleCreateAgent}
          className="btn-primary text-sm px-4 py-2"
        >
          + Create Agent
        </button>
      </div>

      {/* Agent List */}
      <AgentList onEditAgent={handleEditAgent} />

      {/* Agent Form as Bottom Sheet (Mobile) / Modal (Desktop) */}
      {/* ✅ closeOnOutsideClick={false} prevents accidental closing */}
      <BottomSheet
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        title={editingAgent ? 'Edit Agent' : 'Create Agent'}
        closeOnOutsideClick={false}
      >
        <AgentForm
          agent={editingAgent}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      </BottomSheet>
    </div>
  );
}