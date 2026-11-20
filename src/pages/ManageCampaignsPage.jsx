import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentsService } from '../services/agents';
import { useAuthStore } from '../store';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { Megaphone } from 'lucide-react';

export function ManageCampaignsPage() {
  const navigate = useNavigate();
  const { client } = useAuthStore();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const result = await agentsService.getAgents();
      setLoading(false);
      if (result.success) {
        setAgents(result.agents || []);
      }
    };
    load();
  }, []);

  const isPremium = client?.plan === 'premium';

  // Same eligibility as the campaign button on the agent card
  const isBdr = (agent) => {
    const r = (agent.role || '').toLowerCase();
    return r === 'bdr' || r === 'business development representative';
  };

  const eligibleAgents = agents
    .filter(
      (agent) =>
        isPremium &&
        agent.role !== 'SEO Manager' &&
        agent.role !== 'Custom Service Representative'
    )
    .sort((a, b) => {
      const aBdr = isBdr(a) ? 0 : 1;
      const bBdr = isBdr(b) ? 0 : 1;
      return aBdr - bBdr;
    });

  const handleSelect = (agent) => {
    const isMarketingManager = agent.role === 'Marketing Manager';
    navigate(isMarketingManager ? `/agents/${agent._id}/marketing` : `/agents/${agent._id}/campaigns`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (eligibleAgents.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-500">No agents available for campaign management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Manage Campaigns</h2>
        <p className="text-sm text-gray-500 mt-0.5">Select an agent to manage its campaigns</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {eligibleAgents.map((agent) => (
          <button
            key={agent._id}
            onClick={() => handleSelect(agent)}
            className="card p-4 text-left cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {agent.name || 'Unnamed Agent'}
              </h3>
              <span
                className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                  agent.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {agent.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {agent.role && (
                <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                  {agent.role}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-primary-600 ml-auto">
                <Megaphone size={14} />
                Manage
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
