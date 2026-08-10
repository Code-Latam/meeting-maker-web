import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

export function AgentCard({ agent, onEdit, onDelete, isSelected }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isPremium = user?.plan === 'premium';
  const isMarketingManager = agent.role === 'Marketing Manager';
  const isSEO = agent.role === 'SEO Manager';

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';
  };

  const handleViewPersons = (e) => {
    e.stopPropagation();
    navigate(`/agents/${agent._id}/persons`);
  };

  const handleViewCampaigns = (e) => {
    e.stopPropagation();
    if (isMarketingManager) {
      navigate(`/agents/${agent._id}/marketing`);
    } else {
      navigate(`/agents/${agent._id}/campaigns`);
    }
  };

  const showCampaignsBtn = isPremium && !isSEO && agent.role !== 'Custom Service Representative';
  const showPersonsBtn = !isSEO;

  return (
    <div 
      className={`card p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
      }`}
      onClick={() => onEdit(agent)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 truncate">
            {agent.name || 'Unnamed Agent'}
          </h3>
          {agent.role && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
              {agent.role}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(agent.isActive)}`}>
            {agent.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {agent.createdAt && (
            <span>Created: {new Date(agent.createdAt).toLocaleDateString()}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
        {showCampaignsBtn && (
            <button
              onClick={handleViewCampaigns}
              className="p-1.5 text-gray-400 hover:text-green-500 transition-colors rounded-lg hover:bg-green-50"
              title="View campaigns"
            >
              📊
            </button>
          )}
          {showPersonsBtn && (
            <button
              onClick={handleViewPersons}
              className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50"
              title="View assigned persons"
            >
              👥
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(agent);
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
            aria-label="Delete agent"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}