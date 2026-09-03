import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

export function AgentCard({ agent, onEdit, onDelete, isSelected, linkedinCount = 0, emailCount = 0, articleCount = 0 }) {
  const navigate = useNavigate();
  const { user, client } = useAuthStore();
  
  const isPremium = client?.plan === 'premium';
  const isMarketingManager = agent.role === 'Marketing Manager';
  const isSEO = agent.role === 'SEO Manager';
  const isCSR = agent.role === 'Custom Service Representative';

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

  const handleBlogSettings = (e) => {
    e.stopPropagation();
    navigate('/blog');
  };

  const showCampaignsBtn = isPremium && !isSEO && agent.role !== 'Custom Service Representative';
  const showPersonsBtn = !isSEO;
  const showBlogBtn = isSEO;

  // Render badges (LinkedIn/Email or Article) - hidden for Marketing Manager and CSR
  const renderBadges = () => {
    // Exclude Marketing Manager and Custom Service Representative
    if (isMarketingManager || isCSR) {
      return null;
    }

    if (isSEO) {
      const isLow = articleCount < 5;
      return (
        <div className="mt-2 flex gap-1">
          <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${isLow ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
            {isLow ? `⚠️ Low Articles (${articleCount})` : `✅ ${articleCount} articles published`}
          </span>
        </div>
      );
    }

    const linkedinLow = linkedinCount < 50;
    const emailLow = emailCount < 50;
    return (
      <div className="mt-2 flex flex-wrap gap-1">
        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${linkedinLow ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
          {linkedinLow ? `⚠️ Low LinkedIn (${linkedinCount})` : `✅ LinkedIn: ${linkedinCount}`}
        </span>
        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${emailLow ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
          {emailLow ? `⚠️ Low Email (${emailCount})` : `✅ Email: ${emailCount}`}
        </span>
      </div>
    );
  };

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

      {renderBadges()}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {agent.createdAt && (
            <span>Created: {new Date(agent.createdAt).toLocaleDateString()}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {showBlogBtn && (
            <button
              onClick={handleBlogSettings}
              className="p-1.5 text-gray-400 hover:text-purple-500 transition-colors rounded-lg hover:bg-purple-50"
              title="Blog Settings"
            >
              📝
            </button>
          )}
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