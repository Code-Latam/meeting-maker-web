import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignsService } from '../services/campaigns';
import { useUIStore } from '../store';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { Modal } from '../components/Common/Modal';

export function AgentCampaignsPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('search');
  const [searchCampaigns, setSearchCampaigns] = useState([]);
  const [postCampaigns, setPostCampaigns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('search'); // 'search' or 'post'
  const [editingCampaign, setEditingCampaign] = useState(null);
  
  // Search Parameters (locations, industries)
  const [locations, setLocations] = useState([]);
  const [industries, setIndustries] = useState([]);
  
  // Search Campaign Form Data
  const [searchFormData, setSearchFormData] = useState({
    name: '',
    channel: 'linkedin',
    dailyLimit: 30,
    keywords: '',
    titles: '',
    connectionDegree: '2',
    activeStart: 8,
    activeEnd: 18,
    minConfidence: 0.6,
    openToWork: false,
    hiring: false,
    openToWorkOptions: [],
    locations: [],
    industries: []
  });

  // Post Campaign Form Data
  const [postFormData, setPostFormData] = useState({
    name: '',
    channelPreference: 'linkedin',
    postUrl: '',
    dailyLimit: 50
  });

  // Load search parameters
  const loadSearchParameters = async () => {
    const result = await campaignsService.getSearchParameters();
    if (result.success) {
      setLocations(result.locations);
      setIndustries(result.industries);
    }
  };

  // Load campaigns
  const loadSearchCampaigns = async () => {
    const result = await campaignsService.getSearchCampaigns(agentId);
    if (result.success) {
      setSearchCampaigns(result.campaigns);
    }
  };

  const loadPostCampaigns = async () => {
    const result = await campaignsService.getPostCampaigns(agentId);
    if (result.success) {
      setPostCampaigns(result.campaigns);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        loadSearchParameters(),
        loadSearchCampaigns(),
        loadPostCampaigns()
      ]);
      setLoading(false);
    };
    loadAll();
  }, [agentId]);

  // Handle search form field changes
  const handleSearchFormChange = (field, value) => {
    setSearchFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationToggle = (locationId) => {
    setSearchFormData(prev => {
      const current = prev.locations;
      const index = current.indexOf(locationId);
      if (index > -1) {
        return { ...prev, locations: current.filter(id => id !== locationId) };
      } else {
        return { ...prev, locations: [...current, locationId] };
      }
    });
  };

  const handleIndustryToggle = (industryId) => {
    setSearchFormData(prev => {
      const current = prev.industries;
      const index = current.indexOf(industryId);
      if (index > -1) {
        return { ...prev, industries: current.filter(id => id !== industryId) };
      } else {
        return { ...prev, industries: [...current, industryId] };
      }
    });
  };

  const handleOpenToWorkOptionToggle = (option) => {
    setSearchFormData(prev => {
      const current = prev.openToWorkOptions;
      const index = current.indexOf(option);
      if (index > -1) {
        return { ...prev, openToWorkOptions: current.filter(o => o !== option) };
      } else {
        return { ...prev, openToWorkOptions: [...current, option] };
      }
    });
  };

const handleSearchSubmit = async (e) => {
  e.preventDefault();
  
  // =====================================================
  // STEP 1: Get raw input values
  // =====================================================
  
  const keywordsRaw = searchFormData.keywords.trim();
  const titlesRaw = searchFormData.titles.trim();
  
  // =====================================================
  // STEP 2: Validate Keywords
  // =====================================================
  
  // 2a: Check if keywords are empty
  if (!keywordsRaw) {
    showToast('Please enter at least one keyword', 'error');
    return;
  }
  
  // 2b: Check for space-separated keywords (multiple words, no commas)
  if (keywordsRaw && !keywordsRaw.includes(',')) {
    const words = keywordsRaw.split(/\s+/);
    if (words.length > 1) {
      const shouldContinue = window.confirm(
        `⚠️ Keywords appear to be space-separated.\n\n` +
        `You entered: "${keywordsRaw}"\n` +
        `This will be treated as ONE keyword: "${keywordsRaw}"\n\n` +
        `Suggested format: "${words.join(', ')}"\n\n` +
        `"OK" to continue anyway\n"Cancel" to fix manually`
      );
      if (!shouldContinue) return;
    }
  }
  
  // 2c: Parse keywords and check count
  const keywords = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()).filter(Boolean) : [];
  
  if (keywords.length === 0) {
    showToast('Please enter at least one keyword', 'error');
    return;
  }
  
  if (keywords.length > 5) {
    showToast(`Maximum 5 keywords allowed. You entered ${keywords.length}.`, 'error');
    return;
  }
  
  // =====================================================
  // STEP 3: Validate Titles (SINGLE title only!)
  // =====================================================
  
  // 3a: Check if title is empty
  if (!titlesRaw) {
    showToast('Please enter a title', 'error');
    return;
  }
  
  // 3b: Check if user entered multiple titles (comma-separated) - BLOCK!
  if (titlesRaw && titlesRaw.includes(',')) {
    const titleCount = titlesRaw.split(',').filter(t => t.trim()).length;
    showToast(`⚠️ Only ONE title is allowed. You entered ${titleCount} titles. Please enter a single title.`, 'error');
    return;
  }
  
  // 3c: 🆕 Check if title has spaces - WARNING (user might be trying to enter multiple titles)
  if (titlesRaw && titlesRaw.includes(' ')) {
    const wordCount = titlesRaw.split(/\s+/).length;
    const shouldContinue = window.confirm(
      `⚠️ "${titlesRaw}" contains ${wordCount} words with spaces.\n\n` +
      `Only ONE title is allowed.\n` +
      `If you meant to enter multiple titles, only one title is allowed\n\n` +
      `"OK" to continue with "${titlesRaw}" as a single title\n` +
      `"Cancel" to fix manually`
    );
    if (!shouldContinue) return;
  }
  
  // 3d: Parse titles (single value)
  const titles = titlesRaw ? [titlesRaw.trim()] : [];
  
  // =====================================================
  // STEP 4: Campaign name validation
  // =====================================================
  
  if (!searchFormData.name) {
    showToast('Campaign name is required', 'error');
    return;
  }

  // =====================================================
  // STEP 5: Daily limit validation
  // =====================================================
  
  const maxLimit = searchFormData.channel === 'email' ? 200 : 30;
  if (searchFormData.dailyLimit > maxLimit) {
    showToast(`Daily limit for ${searchFormData.channel} cannot exceed ${maxLimit}`, 'error');
    return;
  }

  // =====================================================
  // STEP 6: Submit campaign
  // =====================================================
  
  const data = {
    name: searchFormData.name,
    channel: searchFormData.channel,
    dailyLimit: searchFormData.dailyLimit,
    agentId,
    schedule: {
      activeHours: {
        start: searchFormData.activeStart,
        end: searchFormData.activeEnd
      }
    },
    searchCriteria: {
      keywords,
      titles,
      locations: searchFormData.locations,
      industries: searchFormData.industries,
      connectionDegree: parseInt(searchFormData.connectionDegree),
      openToWork: searchFormData.openToWork,
      hiring: searchFormData.hiring,
      openToWorkOptions: searchFormData.openToWorkOptions
    },
    icpCriteria: {
      minConfidence: searchFormData.minConfidence
    }
  };

  const result = await campaignsService.createSearchCampaign(data);
  if (result.success) {
    showToast('Campaign created successfully', 'success');
    setIsModalOpen(false);
    resetSearchForm();
    await loadSearchCampaigns();
  } else {
    showToast(result.error || 'Failed to create campaign', 'error');
  }
};

  // Handle post campaign submit
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    
    if (!postFormData.name) {
      showToast('Campaign name is required', 'error');
      return;
    }
    
    if (!postFormData.postUrl) {
      showToast('Post URL is required', 'error');
      return;
    }
    
    if (!postFormData.postUrl.includes('linkedin.com')) {
      showToast('Please enter a valid LinkedIn post URL', 'error');
      return;
    }
    
    if (postFormData.dailyLimit < 1 || postFormData.dailyLimit > 500) {
      showToast('Daily limit must be between 1 and 500', 'error');
      return;
    }

    const data = {
      name: postFormData.name,
      channelPreference: postFormData.channelPreference,
      postUrl: postFormData.postUrl,
      dailyLimit: postFormData.dailyLimit,
      agentId
    };

    const result = await campaignsService.createPostCampaign(data);
    if (result.success) {
      showToast('Post campaign created successfully', 'success');
      setIsModalOpen(false);
      resetPostForm();
      await loadPostCampaigns();
    } else {
      showToast(result.error || 'Failed to create post campaign', 'error');
    }
  };

  const resetSearchForm = () => {
    setSearchFormData({
      name: '',
      channel: 'linkedin',
      dailyLimit: 30,
      keywords: '',
      titles: '',
      connectionDegree: '2',
      activeStart: 8,
      activeEnd: 18,
      minConfidence: 0.6,
      openToWork: false,
      hiring: false,
      openToWorkOptions: [],
      locations: [],
      industries: []
    });
  };

  const resetPostForm = () => {
    setPostFormData({
      name: '',
      channelPreference: 'linkedin',
      postUrl: '',
      dailyLimit: 50
    });
  };

  // Handle campaign actions
  const handleToggle = async (campaignId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const result = await campaignsService.updateSearchCampaign(campaignId, { status: newStatus });
    if (result.success) {
      showToast(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'}`, 'success');
      await loadSearchCampaigns();
    } else {
      showToast(result.error || 'Failed to update campaign', 'error');
    }
  };

  const handleDelete = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    const result = await campaignsService.deleteSearchCampaign(campaignId);
    if (result.success) {
      showToast('Campaign deleted', 'success');
      await loadSearchCampaigns();
    } else {
      showToast(result.error || 'Failed to delete campaign', 'error');
    }
  };

  const handlePostToggle = async (campaignId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const result = await campaignsService.updatePostCampaign(campaignId, { status: newStatus });
    if (result.success) {
      showToast(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'}`, 'success');
      await loadPostCampaigns();
    } else {
      showToast(result.error || 'Failed to update campaign', 'error');
    }
  };

  const handlePostDelete = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this post campaign?')) return;
    const result = await campaignsService.deletePostCampaign(campaignId);
    if (result.success) {
      showToast('Post campaign deleted', 'success');
      await loadPostCampaigns();
    } else {
      showToast(result.error || 'Failed to delete campaign', 'error');
    }
  };

  const getStatusClass = (status) => {
    const classes = {
      'active': 'bg-green-100 text-green-700',
      'paused': 'bg-yellow-100 text-yellow-700',
      'completed': 'bg-gray-100 text-gray-500',
      'archived': 'bg-gray-100 text-gray-500'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  };

  const renderSearchCampaigns = () => {
    if (searchCampaigns.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-500">No search campaigns yet</p>
          <button
            onClick={() => { setModalType('search'); setIsModalOpen(true); }}
            className="mt-3 btn-primary text-sm"
          >
            + Create Campaign
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {searchCampaigns.map((campaign) => (
          <div key={campaign._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getStatusClass(campaign.status)}`}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  {campaign.channel === 'email' ? '📧 Email' : '🔗 LinkedIn'}
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Keywords:</span>
                <span className="ml-1 text-gray-700">{campaign.searchCriteria?.keywords?.join(', ') || 'Any'}</span>
              </div>
              <div>
                <span className="text-gray-500">Daily Limit:</span>
                <span className="ml-1 text-gray-700">{campaign.dailyLimit}</span>
              </div>
              <div>
                <span className="text-gray-500">Today:</span>
                <span className="ml-1 text-gray-700">{campaign.dailyProcessed || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Leads Added:</span>
                <span className="ml-1 text-gray-700">{campaign.stats?.leadsAdded || 0}</span>
              </div>
            </div>

            <div className="mt-3 flex gap-2 justify-end">
              <button
                onClick={() => handleToggle(campaign._id, campaign.status)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {campaign.status === 'active' ? '⏸️ Pause' : campaign.status === 'paused' ? '▶️ Resume' : '✅ Activate'}
              </button>
              <button
                onClick={() => handleDelete(campaign._id)}
                className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPostCampaigns = () => {
    if (postCampaigns.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-gray-500">No post campaigns yet</p>
          <button
            onClick={() => { setModalType('post'); setIsModalOpen(true); }}
            className="mt-3 btn-primary text-sm"
          >
            + Create Post Campaign
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {postCampaigns.map((campaign) => (
          <div key={campaign._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">📝 {campaign.name}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getStatusClass(campaign.status)}`}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  {campaign.channelPreference === 'email' ? '📧 Email' : '🔗 LinkedIn'}
                </span>
              </div>
            </div>

            <div className="mt-2 text-sm">
              <span className="text-gray-500">Post:</span>
              <span className="ml-1 text-gray-700 truncate block">{campaign.postUrl}</span>
            </div>

            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Comments:</span>
                <span className="ml-1 text-gray-700">{campaign.stats?.commentsFetched || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Unique:</span>
                <span className="ml-1 text-gray-700">{campaign.stats?.uniqueCommenters || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Added:</span>
                <span className="ml-1 text-gray-700">{campaign.stats?.leadsAdded || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Daily Limit:</span>
                <span className="ml-1 text-gray-700">{campaign.dailyLimit}</span>
              </div>
            </div>

            <div className="mt-3 flex gap-2 justify-end">
              <button
                onClick={() => handlePostToggle(campaign._id, campaign.status)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {campaign.status === 'active' ? '⏸️ Pause' : campaign.status === 'paused' ? '▶️ Resume' : '✅ Activate'}
              </button>
              <button
                onClick={() => handlePostDelete(campaign._id)}
                className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-flex items-center gap-1"
          >
            ← Back to Agents
          </button>
          <h2 className="text-xl font-semibold text-gray-800">📊 Lead Generation Campaigns</h2>
        </div>
        <button
          onClick={() => { setModalType(activeTab === 'search' ? 'search' : 'post'); setIsModalOpen(true); }}
          className="btn-primary text-sm"
        >
          {activeTab === 'search' ? '+ New Search Campaign' : '+ New Post Campaign'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🔍 Search Campaigns
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'post'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 Post Campaigns
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'search' ? renderSearchCampaigns() : renderPostCampaigns()}

      {/* ===================================================== */}
      {/* SEARCH CAMPAIGN MODAL */}
      {/* ===================================================== */}
      <Modal
        isOpen={isModalOpen && modalType === 'search'}
        onClose={() => { setIsModalOpen(false); resetSearchForm(); }}
        title="Create Search Campaign"
        maxWidth="lg"
      >
        <form onSubmit={handleSearchSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              value={searchFormData.name}
              onChange={(e) => handleSearchFormChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="e.g., SaaS Sales Leaders Q2"
              required
            />
          </div>

          {/* Channel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel *
            </label>
            <select
              value={searchFormData.channel}
              onChange={(e) => {
                const channel = e.target.value;
                handleSearchFormChange('channel', channel);
                handleSearchFormChange('dailyLimit', channel === 'email' ? 200 : 30);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="linkedin">🔗 LinkedIn</option>
              <option value="email">📧 Email</option>
            </select>
          </div>

          {/* Daily Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Lead Limit
            </label>
            <input
              type="number"
              value={searchFormData.dailyLimit}
              onChange={(e) => handleSearchFormChange('dailyLimit', parseInt(e.target.value) || 0)}
              min="1"
              max={searchFormData.channel === 'email' ? 200 : 30}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {searchFormData.channel === 'email' ? 'Max 200 leads/day' : 'Max 30 leads/day'}
            </p>
          </div>

          {/* Active Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Active Hours Start
              </label>
              <input
                type="number"
                value={searchFormData.activeStart}
                onChange={(e) => handleSearchFormChange('activeStart', parseInt(e.target.value) || 0)}
                min="0"
                max="23"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Active Hours End
              </label>
              <input
                type="number"
                value={searchFormData.activeEnd}
                onChange={(e) => handleSearchFormChange('activeEnd', parseInt(e.target.value) || 0)}
                min="0"
                max="23"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords (max 5)
            </label>
            <input
              type="text"
              value={searchFormData.keywords}
              onChange={(e) => handleSearchFormChange('keywords', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="e.g., sales director, VP of sales"
            />
            <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
          </div>

          {/* Titles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={searchFormData.titles}
              onChange={(e) => handleSearchFormChange('titles', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="e.g., Sales Director, Head of Growth"
            />
            <p className="text-xs text-gray-500 mt-1">Only one title allowed</p>
          </div>

          {/* Locations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Locations
            </label>
            <div className="border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto">
              {locations.length === 0 ? (
                <p className="text-sm text-gray-500">Loading locations...</p>
              ) : (
                locations.map((loc) => (
                  <label key={loc.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchFormData.locations.includes(loc.id)}
                      onChange={() => handleLocationToggle(loc.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{loc.title || loc.name}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Select locations to target</p>
          </div>

          {/* Industries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industries
            </label>
            <div className="border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto">
              {industries.length === 0 ? (
                <p className="text-sm text-gray-500">Loading industries...</p>
              ) : (
                industries.map((ind) => (
                  <label key={ind.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchFormData.industries.includes(ind.id)}
                      onChange={() => handleIndustryToggle(ind.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{ind.title || ind.name}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Select industries to target</p>
          </div>

          {/* Connection Degree */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Connection Degree
            </label>
            <select
              value={searchFormData.connectionDegree}
              onChange={(e) => handleSearchFormChange('connectionDegree', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="1">1st Degree (Already connected)</option>
              <option value="2">2nd Degree (Mutual connections)</option>
              <option value="3">3rd+ Degree</option>
            </select>
          </div>

          {/* AI Confidence Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI Confidence Threshold
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={searchFormData.minConfidence}
                onChange={(e) => handleSearchFormChange('minConfidence', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <span className="text-sm font-medium text-gray-700 min-w-[40px]">
                {searchFormData.minConfidence.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 (Loose)</span>
              <span>1 (Strict)</span>
            </div>
          </div>

          {/* Open to Work */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={searchFormData.openToWork}
                onChange={(e) => handleSearchFormChange('openToWork', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">🎯 Filter by "Open to Work"</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">PREMIUM</span>
            </label>
            
            {searchFormData.openToWork && (
              <div className="mt-3 grid grid-cols-2 gap-2 ml-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Remote', 'Hybrid', 'On-site'].map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-100 rounded">
                    <input
                      type="checkbox"
                      checked={searchFormData.openToWorkOptions.includes(option)}
                      onChange={() => handleOpenToWorkOptionToggle(option)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Find candidates actively looking for opportunities</p>
          </div>

          {/* Hiring */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={searchFormData.hiring}
                onChange={(e) => handleSearchFormChange('hiring', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">🏢 Filter by "Hiring"</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">PREMIUM</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">Find companies that are actively hiring</p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" className="flex-1 btn-primary">
              Create Campaign
            </button>
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); resetSearchForm(); }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================== */}
      {/* POST CAMPAIGN MODAL */}
      {/* ===================================================== */}
      <Modal
        isOpen={isModalOpen && modalType === 'post'}
        onClose={() => { setIsModalOpen(false); resetPostForm(); }}
        title="Create Post Campaign"
        maxWidth="lg"
      >
        <form onSubmit={handlePostSubmit} className="space-y-4">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              value={postFormData.name}
              onChange={(e) => setPostFormData({ ...postFormData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="e.g., Viral AI Post - March 2025"
              required
            />
          </div>

          {/* Channel Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel Preference *
            </label>
            <select
              value={postFormData.channelPreference}
              onChange={(e) => setPostFormData({ ...postFormData, channelPreference: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="linkedin">🔗 LinkedIn</option>
              <option value="email">📧 Email</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Select which channel to use for leads from this post campaign</p>
          </div>

          {/* LinkedIn Post URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Post URL *
            </label>
            <input
              type="url"
              value={postFormData.postUrl}
              onChange={(e) => setPostFormData({ ...postFormData, postUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="https://www.linkedin.com/feed/update/urn:li:activity:123456789/"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Only public posts. We'll extract all unique commenters.</p>
          </div>

          {/* Daily Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Lead Limit
            </label>
            <input
              type="number"
              value={postFormData.dailyLimit}
              onChange={(e) => setPostFormData({ ...postFormData, dailyLimit: parseInt(e.target.value) || 0 })}
              min="1"
              max="500"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum leads to add per day (1-500)</p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800">💡 How Post Campaigns Work:</p>
            <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>We fetch all comments from the LinkedIn post</li>
              <li>Extract unique commenters (no duplicates)</li>
              <li>Fetch their LinkedIn profiles</li>
              <li>Add them as leads (no AI filtering - they're already engaged!)</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" className="flex-1 btn-primary">
              Create Post Campaign
            </button>
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); resetPostForm(); }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}