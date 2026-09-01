import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignsService } from '../services/campaigns';
import { useUIStore } from '../store';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { Modal } from '../components/Common/Modal';

export function MarketingCampaignsPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('keyword');
  const [keywordCampaigns, setKeywordCampaigns] = useState([]);
  const [influencerCampaigns, setInfluencerCampaigns] = useState([]);
  const [commentReplyCampaigns, setCommentReplyCampaigns] = useState([]);
  const [marketConnectionsCampaigns, setMarketConnectionsCampaigns] = useState([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('keyword'); // 'keyword', 'influencer', 'commentreply', 'marketconnections'
  const [editingCampaign, setEditingCampaign] = useState(null);
  
  // Find Influencers Modal
  const [isFindInfluencersOpen, setIsFindInfluencersOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchingInfluencers, setSearchingInfluencers] = useState(false);
  const [influencerSearchData, setInfluencerSearchData] = useState({
    keywords: '',
    minReactions: 40,
    minFollowers: 50000,
    postAge: 'past_month'
  });
  const [selectedInfluencers, setSelectedInfluencers] = useState([]);

  // Keyword Campaign Form
  const [keywordForm, setKeywordForm] = useState({
    name: '',
    keywords: '',
    maxAgeDays: 7,
    minComments: 50,
    dailyLimit: 50
  });

  // Influencer Campaign Form
  const [influencerForm, setInfluencerForm] = useState({
    name: '',
    influencerUrls: '',
    dailyLimit: 50
  });

  // Comment Reply Campaign Form
  const [commentReplyForm, setCommentReplyForm] = useState({
    name: '',
    ownProfileUrl: '',
    maxAgeDays: 7,
    dailyLimit: 50
  });

  // Market Connections Campaign Form
  const [marketConnectionsForm, setMarketConnectionsForm] = useState({
    name: '',
    keywords: '',
    messageTemplate: '',
    dailyLimit: 50,
    maxMessages: ''
  });

  // Load all campaigns
  const loadAllCampaigns = async () => {
    setLoading(true);
    await Promise.all([
      loadKeywordCampaigns(),
      loadInfluencerCampaigns(),
      loadCommentReplyCampaigns(),
      loadMarketConnectionsCampaigns()
    ]);
    setLoading(false);
  };

  const loadKeywordCampaigns = async () => {
    const result = await campaignsService.getKeywordCampaigns(agentId);
    if (result.success) setKeywordCampaigns(result.campaigns);
  };

  const loadInfluencerCampaigns = async () => {
    const result = await campaignsService.getInfluencerCampaigns(agentId);
    if (result.success) setInfluencerCampaigns(result.campaigns);
  };

  const loadCommentReplyCampaigns = async () => {
    const result = await campaignsService.getCommentReplyCampaigns(agentId);
    if (result.success) setCommentReplyCampaigns(result.campaigns);
  };

  const loadMarketConnectionsCampaigns = async () => {
    const result = await campaignsService.getMarketConnectionsCampaigns(agentId);
    if (result.success) setMarketConnectionsCampaigns(result.campaigns);
  };

  useEffect(() => {
    loadAllCampaigns();
  }, [agentId]);

  const getStatusClass = (status) => {
    const classes = {
      'active': 'bg-green-100 text-green-700',
      'paused': 'bg-yellow-100 text-yellow-700',
      'completed': 'bg-gray-100 text-gray-500',
      'draft': 'bg-gray-100 text-gray-500'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  };

  // =====================================================
  // KEYWORD CAMPAIGN HANDLERS
  // =====================================================
  
  const handleKeywordSubmit = async (e) => {
    e.preventDefault();
    
    const keywords = keywordForm.keywords.split(',').map(k => k.trim()).filter(Boolean);
    
    if (!keywordForm.name) {
      showToast('Campaign name is required', 'error');
      return;
    }
    if (keywords.length === 0) {
      showToast('At least one keyword is required', 'error');
      return;
    }
    
    const data = {
      name: keywordForm.name,
      agentId,
      keywords,
      maxAgeDays: keywordForm.maxAgeDays,
      minComments: keywordForm.minComments,
      dailyLimit: keywordForm.dailyLimit
    };
    
    const result = await campaignsService.createKeywordCampaign(data);
    if (result.success) {
      showToast('Keyword campaign created successfully', 'success');
      setIsModalOpen(false);
      resetKeywordForm();
      await loadKeywordCampaigns();
    } else {
      showToast(result.error || 'Failed to create campaign', 'error');
    }
  };

  const handleToggleKeyword = async (id, status) => {
    const newStatus = status === 'active' ? 'paused' : 'active';
    const result = await campaignsService.updateKeywordCampaign(id, { status: newStatus });
    if (result.success) {
      showToast(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'}`, 'success');
      await loadKeywordCampaigns();
    }
  };

  const handleDeleteKeyword = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    const result = await campaignsService.deleteKeywordCampaign(id);
    if (result.success) {
      showToast('Campaign deleted', 'success');
      await loadKeywordCampaigns();
    }
  };

  const resetKeywordForm = () => {
    setKeywordForm({
      name: '',
      keywords: '',
      maxAgeDays: 7,
      minComments: 50,
      dailyLimit: 50
    });
  };

  // =====================================================
  // INFLUENCER CAMPAIGN HANDLERS
  // =====================================================
  
  const handleInfluencerSubmit = async (e) => {
    e.preventDefault();
    
    const influencerUrls = influencerForm.influencerUrls.split('\n').map(u => u.trim()).filter(Boolean);
    
    if (!influencerForm.name) {
      showToast('Campaign name is required', 'error');
      return;
    }
    if (influencerUrls.length === 0) {
      showToast('At least one influencer URL is required', 'error');
      return;
    }
    
    const data = {
      name: influencerForm.name,
      agentId,
      influencerUrls,
      dailyLimit: influencerForm.dailyLimit
    };
    
    const result = await campaignsService.createInfluencerCampaign(data);
    if (result.success) {
      showToast('Influencer campaign created successfully', 'success');
      setIsModalOpen(false);
      resetInfluencerForm();
      await loadInfluencerCampaigns();
    } else {
      showToast(result.error || 'Failed to create campaign', 'error');
    }
  };

  const handleEditInfluencer = async (campaign) => {
    setEditingCampaign(campaign);
    setInfluencerForm({
      name: campaign.name,
      influencerUrls: (campaign.influencers || []).map(inf => inf.profileUrl).join('\n'),
      dailyLimit: campaign.dailyLimit || 50
    });
    setModalType('influencer');
    setIsModalOpen(true);
  };

  const handleUpdateInfluencer = async (e) => {
    e.preventDefault();
    
    const influencerUrls = influencerForm.influencerUrls.split('\n').map(u => u.trim()).filter(Boolean);
    
    if (!influencerForm.name) {
      showToast('Campaign name is required', 'error');
      return;
    }
    if (influencerUrls.length === 0) {
      showToast('At least one influencer URL is required', 'error');
      return;
    }
    
    const data = {
      name: influencerForm.name,
      influencerUrls
    };
    
    const result = await campaignsService.updateInfluencerCampaign(editingCampaign._id, data);
    if (result.success) {
      showToast('Campaign updated successfully', 'success');
      setIsModalOpen(false);
      resetInfluencerForm();
      setEditingCampaign(null);
      await loadInfluencerCampaigns();
    } else {
      showToast(result.error || 'Failed to update campaign', 'error');
    }
  };

  const handleToggleInfluencer = async (id, status) => {
    const newStatus = status === 'active' ? 'paused' : 'active';
    const result = await campaignsService.updateInfluencerCampaign(id, { status: newStatus });
    if (result.success) {
      showToast(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'}`, 'success');
      await loadInfluencerCampaigns();
    }
  };

  const handleDeleteInfluencer = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    const result = await campaignsService.deleteInfluencerCampaign(id);
    if (result.success) {
      showToast('Campaign deleted', 'success');
      await loadInfluencerCampaigns();
    }
  };

  const resetInfluencerForm = () => {
    setInfluencerForm({
      name: '',
      influencerUrls: '',
      dailyLimit: 50
    });
    setEditingCampaign(null);
  };

  // =====================================================
  // COMMENT REPLY CAMPAIGN HANDLERS
  // =====================================================
  
  const handleCommentReplySubmit = async (e) => {
    e.preventDefault();
    
    if (!commentReplyForm.name) {
      showToast('Campaign name is required', 'error');
      return;
    }
    if (!commentReplyForm.ownProfileUrl || !commentReplyForm.ownProfileUrl.includes('linkedin.com')) {
      showToast('Please enter a valid LinkedIn profile URL', 'error');
      return;
    }
    
    const data = {
      name: commentReplyForm.name,
      agentId,
      ownProfileUrl: commentReplyForm.ownProfileUrl,
      maxAgeDays: commentReplyForm.maxAgeDays,
      dailyLimit: commentReplyForm.dailyLimit
    };
    
    const result = await campaignsService.createCommentReplyCampaign(data);
    if (result.success) {
      showToast('Comment reply campaign created successfully', 'success');
      setIsModalOpen(false);
      resetCommentReplyForm();
      await loadCommentReplyCampaigns();
    } else {
      showToast(result.error || 'Failed to create campaign', 'error');
    }
  };

  const handleToggleCommentReply = async (id, status) => {
    const newStatus = status === 'active' ? 'paused' : 'active';
    const result = await campaignsService.updateCommentReplyCampaign(id, { status: newStatus });
    if (result.success) {
      showToast(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'}`, 'success');
      await loadCommentReplyCampaigns();
    }
  };

  const handleDeleteCommentReply = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    const result = await campaignsService.deleteCommentReplyCampaign(id);
    if (result.success) {
      showToast('Campaign deleted', 'success');
      await loadCommentReplyCampaigns();
    }
  };

  const resetCommentReplyForm = () => {
    setCommentReplyForm({
      name: '',
      ownProfileUrl: '',
      maxAgeDays: 7,
      dailyLimit: 50
    });
  };

  // =====================================================
  // MARKET CONNECTIONS CAMPAIGN HANDLERS
  // =====================================================
  
  const handleMarketConnectionsSubmit = async (e) => {
    e.preventDefault();
    
    const keywords = marketConnectionsForm.keywords.split(',').map(k => k.trim()).filter(Boolean);
    
    if (!marketConnectionsForm.name) {
      showToast('Campaign name is required', 'error');
      return;
    }
    if (keywords.length === 0) {
      showToast('At least one keyword is required', 'error');
      return;
    }
    if (!marketConnectionsForm.messageTemplate) {
      showToast('Message template is required', 'error');
      return;
    }
    
    const data = {
      name: marketConnectionsForm.name,
      agentId,
      keywords,
      messageTemplate: marketConnectionsForm.messageTemplate,
      dailyLimit: marketConnectionsForm.dailyLimit,
      maxMessages: marketConnectionsForm.maxMessages ? parseInt(marketConnectionsForm.maxMessages) : null
    };
    
    const result = await campaignsService.createMarketConnectionsCampaign(data);
    if (result.success) {
      showToast('Market connections campaign created successfully', 'success');
      setIsModalOpen(false);
      resetMarketConnectionsForm();
      await loadMarketConnectionsCampaigns();
    } else {
      showToast(result.error || 'Failed to create campaign', 'error');
    }
  };

  const handleToggleMarketConnections = async (id, status) => {
    const newStatus = status === 'active' ? 'paused' : 'active';
    const result = await campaignsService.updateMarketConnectionsCampaign(id, { status: newStatus });
    if (result.success) {
      showToast(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'}`, 'success');
      await loadMarketConnectionsCampaigns();
    }
  };

  const handleCompleteMarketConnections = async (id) => {
    if (!confirm('Mark this campaign as completed? This action cannot be undone.')) return;
    const result = await campaignsService.updateMarketConnectionsCampaign(id, { status: 'completed' });
    if (result.success) {
      showToast('Campaign completed', 'success');
      await loadMarketConnectionsCampaigns();
    }
  };

  const handleRenameMarketConnections = async (campaign) => {
    const newName = prompt('Enter new campaign name:', campaign.name);
    if (newName && newName.trim() && newName.trim() !== campaign.name) {
      const result = await campaignsService.updateMarketConnectionsCampaign(campaign._id, { name: newName.trim() });
      if (result.success) {
        showToast('Campaign renamed', 'success');
        await loadMarketConnectionsCampaigns();
      }
    }
  };

  const handleDeleteMarketConnections = async (id) => {
    if (!confirm('Delete this campaign? All data will be lost.')) return;
    const result = await campaignsService.deleteMarketConnectionsCampaign(id);
    if (result.success) {
      showToast('Campaign deleted', 'success');
      await loadMarketConnectionsCampaigns();
    }
  };

  const resetMarketConnectionsForm = () => {
    setMarketConnectionsForm({
      name: '',
      keywords: '',
      messageTemplate: '',
      dailyLimit: 50,
      maxMessages: ''
    });
  };

  // =====================================================
  // FIND INFLUENCERS
  // =====================================================
  
 // =====================================================
// FIND INFLUENCERS
// =====================================================
  
const handleSearchInfluencers = async () => {
  const keywords = influencerSearchData.keywords.split(',').map(k => k.trim()).filter(Boolean);
  if (keywords.length === 0) {
    showToast('Please enter keywords', 'error');
    return;
  }
  
  setSearchingInfluencers(true);
  setSearchResults([]);
  
  try {
    const result = await campaignsService.findInfluencers({
      keywords,
      minReactions: influencerSearchData.minReactions,
      minFollowers: influencerSearchData.minFollowers,
      postAge: influencerSearchData.postAge
    });
    
    if (result.success) {
      console.log('✅ Found influencers:', result.influencers.length);
      setSearchResults(result.influencers || []);
      setSelectedInfluencers([]);
      
      if (result.influencers.length === 0) {
        showToast('No influencers found matching your criteria', 'info');
      }
    } else {
      console.error('❌ Search failed:', result.error);
      showToast(result.error || 'Failed to find influencers', 'error');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    showToast('An unexpected error occurred', 'error');
  } finally {
    setSearchingInfluencers(false);
  }
};

  const toggleInfluencerSelection = (influencer) => {
    setSelectedInfluencers(prev => {
      const exists = prev.find(i => i.profileUrl === influencer.profileUrl);
      if (exists) {
        return prev.filter(i => i.profileUrl !== influencer.profileUrl);
      } else {
        return [...prev, influencer];
      }
    });
  };

  const addSelectedInfluencers = () => {
    if (selectedInfluencers.length === 0) {
      showToast('Please select at least one influencer', 'error');
      return;
    }
    
    const urls = selectedInfluencers.map(i => i.profileUrl).join('\n');
    const currentUrls = influencerForm.influencerUrls ? influencerForm.influencerUrls + '\n' + urls : urls;
    
    // Remove duplicates
    const urlSet = new Set(currentUrls.split('\n').map(u => u.trim()).filter(Boolean));
    
    setInfluencerForm({
      ...influencerForm,
      influencerUrls: Array.from(urlSet).join('\n')
    });
    
    showToast(`Added ${selectedInfluencers.length} influencer(s) to campaign`);
    setIsFindInfluencersOpen(false);
    setSearchResults([]);
    setSelectedInfluencers([]);
  };

  // =====================================================
  // RENDER FUNCTIONS
  // =====================================================
  
  const renderCampaignCard = (campaign, type, actions) => {
    const statusClass = getStatusClass(campaign.status);
    const statusText = campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1);

    return (
      <div key={campaign._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
            <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${statusClass}`}>
              {statusText}
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Daily Limit:</span>
            <span className="ml-1 text-gray-700">{campaign.dailyLimit || 50}</span>
          </div>
          <div>
            <span className="text-gray-500">Today:</span>
            <span className="ml-1 text-gray-700">{campaign.dailyProcessed || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Found:</span>
            <span className="ml-1 text-gray-700">
              {campaign.stats?.postsFound || campaign.stats?.commentsFound || campaign.stats?.connectionsFound || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Engaged:</span>
            <span className="ml-1 text-gray-700">
              {campaign.stats?.postsEngaged || campaign.stats?.commentsReplied || campaign.stats?.messagesSent || 0}
            </span>
          </div>
        </div>

        <div className="mt-3 flex gap-2 justify-end flex-wrap">
          {actions}
        </div>
      </div>
    );
  };

  const renderKeywordCampaigns = () => {
    if (keywordCampaigns.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-500">No keyword campaigns yet</p>
          <button
            onClick={() => { setModalType('keyword'); setEditingCampaign(null); setIsModalOpen(true); }}
            className="mt-3 btn-primary text-sm"
          >
            + Create Campaign
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {keywordCampaigns.map((campaign) => renderCampaignCard(campaign, 'keyword', [
          <button
            key="toggle"
            onClick={() => handleToggleKeyword(campaign._id, campaign.status)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {campaign.status === 'active' ? '⏸️ Pause' : '▶️ Resume'}
          </button>,
          <button
            key="delete"
            onClick={() => handleDeleteKeyword(campaign._id)}
            className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            🗑️ Delete
          </button>
        ]))}
      </div>
    );
  };

  const renderInfluencerCampaigns = () => {
    if (influencerCampaigns.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-500">No influencer campaigns yet</p>
          <button
            onClick={() => { setModalType('influencer'); setEditingCampaign(null); setIsModalOpen(true); }}
            className="mt-3 btn-primary text-sm"
          >
            + Create Campaign
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {influencerCampaigns.map((campaign) => renderCampaignCard(campaign, 'influencer', [
          <button
            key="toggle"
            onClick={() => handleToggleInfluencer(campaign._id, campaign.status)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {campaign.status === 'active' ? '⏸️ Pause' : '▶️ Resume'}
          </button>,
          <button
            key="edit"
            onClick={() => handleEditInfluencer(campaign)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ✏️ Edit
          </button>,
          <button
            key="delete"
            onClick={() => handleDeleteInfluencer(campaign._id)}
            className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            🗑️ Delete
          </button>
        ]))}
      </div>
    );
  };

  const renderCommentReplyCampaigns = () => {
    if (commentReplyCampaigns.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-gray-500">No comment reply campaigns yet</p>
          <button
            onClick={() => { setModalType('commentreply'); setIsModalOpen(true); }}
            className="mt-3 btn-primary text-sm"
          >
            + Create Campaign
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {commentReplyCampaigns.map((campaign) => renderCampaignCard(campaign, 'commentreply', [
          <button
            key="toggle"
            onClick={() => handleToggleCommentReply(campaign._id, campaign.status)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {campaign.status === 'active' ? '⏸️ Pause' : '▶️ Resume'}
          </button>,
          <button
            key="delete"
            onClick={() => handleDeleteCommentReply(campaign._id)}
            className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            🗑️ Delete
          </button>
        ]))}
      </div>
    );
  };

 const renderMarketConnectionsCampaigns = () => {
  if (marketConnectionsCampaigns.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-4xl mb-3">🔗</div>
        <p className="text-gray-500">No message to connections campaigns yet</p>
        <button
          onClick={() => { setModalType('marketconnections'); setIsModalOpen(true); }}
          className="mt-3 btn-primary text-sm"
        >
          + Create Campaign
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {marketConnectionsCampaigns.map((campaign) => (
        <div key={campaign._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getStatusClass(campaign.status)}`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
            </div>
          </div>

          {/* ✅ Show Keywords */}
          {campaign.keywords && campaign.keywords.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-gray-500">Keywords:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {campaign.keywords.map((kw, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ✅ Show Message Template */}
          {campaign.messageTemplate && (
            <div className="mt-2">
              <span className="text-xs text-gray-500">Message Template:</span>
              <div className="mt-1 p-2 bg-gray-50 rounded text-sm text-gray-600 border border-gray-200">
                {campaign.messageTemplate.length > 100 
                  ? campaign.messageTemplate.substring(0, 100) + '...' 
                  : campaign.messageTemplate}
              </div>
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Daily Limit:</span>
              <span className="ml-1 text-gray-700">{campaign.dailyLimit || 50}</span>
            </div>
            <div>
              <span className="text-gray-500">Today:</span>
              <span className="ml-1 text-gray-700">{campaign.dailyProcessed || 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Found:</span>
              <span className="ml-1 text-gray-700">{campaign.stats?.connectionsFound || 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Messages Sent:</span>
              <span className="ml-1 text-gray-700">{campaign.stats?.messagesSent || 0}</span>
            </div>
          </div>

          <div className="mt-3 flex gap-2 justify-end flex-wrap">
            {campaign.status !== 'completed' && (
              <>
                <button
                  onClick={() => handleToggleMarketConnections(campaign._id, campaign.status)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {campaign.status === 'active' ? '⏸️ Pause' : '▶️ Resume'}
                </button>
                <button
                  onClick={() => handleCompleteMarketConnections(campaign._id)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  🏁 Complete
                </button>
              </>
            )}
            <button
              onClick={() => handleRenameMarketConnections(campaign)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ✏️ Rename
            </button>
            <button
              onClick={() => handleDeleteMarketConnections(campaign._id)}
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
          <h2 className="text-xl font-semibold text-gray-800">📢 Marketing Engagement Campaigns</h2>
        </div>
        <button
          onClick={() => { 
            const tabMap = {
              'keyword': 'keyword',
              'influencer': 'influencer',
              'commentreply': 'commentreply',
              'marketconnections': 'marketconnections'
            };
            setModalType(tabMap[activeTab] || 'keyword');
            setEditingCampaign(null);
            setIsModalOpen(true);
          }}
          className="btn-primary text-sm"
        >
          + New Campaign
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {[
            { id: 'keyword', label: '🔍 Keyword Search' },
            { id: 'influencer', label: '👥 Influencer Following' },
            { id: 'commentreply', label: '💬 Comment Reply' },
            { id: 'marketconnections', label: '🔗 Message to Connections' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'keyword' && renderKeywordCampaigns()}
      {activeTab === 'influencer' && renderInfluencerCampaigns()}
      {activeTab === 'commentreply' && renderCommentReplyCampaigns()}
      {activeTab === 'marketconnections' && renderMarketConnectionsCampaigns()}

      {/* ===================================================== */}
      {/* KEYWORD CAMPAIGN MODAL */}
      {/* ===================================================== */}
      <Modal
        isOpen={isModalOpen && modalType === 'keyword'}
        onClose={() => { setIsModalOpen(false); resetKeywordForm(); }}
        title="Create Keyword Search Campaign"
        maxWidth="lg"
      >
        <form onSubmit={handleKeywordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              value={keywordForm.name}
              onChange={(e) => setKeywordForm({ ...keywordForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="e.g., AI Automation Posts"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords *
            </label>
            <input
              type="text"
              value={keywordForm.keywords}
              onChange={(e) => setKeywordForm({ ...keywordForm, keywords: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="e.g., AI automation, lead generation, sales tips"
            />
            <p className="text-xs text-gray-500 mt-1">Separate keywords with commas. Posts matching any keyword will be found.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Age (Days)
              </label>
              <input
                type="number"
                value={keywordForm.maxAgeDays}
                onChange={(e) => setKeywordForm({ ...keywordForm, maxAgeDays: parseInt(e.target.value) || 7 })}
                min="1"
                max="30"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Only posts from the last X days</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Comments
              </label>
              <input
                type="number"
                value={keywordForm.minComments}
                onChange={(e) => setKeywordForm({ ...keywordForm, minComments: parseInt(e.target.value) || 50 })}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum comments to qualify as viral</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Limit
            </label>
            <input
              type="number"
              value={keywordForm.dailyLimit}
              onChange={(e) => setKeywordForm({ ...keywordForm, dailyLimit: parseInt(e.target.value) || 50 })}
              min="1"
              max="500"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Max posts to engage per day</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800">📌 How it works:</p>
            <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>Searches LinkedIn for posts matching your keywords</li>
              <li>Filters posts by age and minimum comments</li>
              <li>Likes and adds an AI-generated comment to each post</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" className="flex-1 btn-primary">Create Campaign</button>
            <button type="button" onClick={() => { setIsModalOpen(false); resetKeywordForm(); }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* ===================================================== */}
      {/* INFLUENCER CAMPAIGN MODAL (Create & Edit) */}
      {/* ===================================================== */}
      <Modal
        isOpen={isModalOpen && modalType === 'influencer'}
        onClose={() => { setIsModalOpen(false); resetInfluencerForm(); }}
        title={editingCampaign ? 'Edit Influencer Following Campaign' : 'Create Influencer Following Campaign'}
        maxWidth="lg"
      >
        <form onSubmit={editingCampaign ? handleUpdateInfluencer : handleInfluencerSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              value={influencerForm.name}
              onChange={(e) => setInfluencerForm({ ...influencerForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="e.g., Industry Leaders"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Influencer LinkedIn URLs *
            </label>
            <textarea
              value={influencerForm.influencerUrls}
              onChange={(e) => setInfluencerForm({ ...influencerForm, influencerUrls: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
              placeholder="https://www.linkedin.com/in/username/&#10;https://www.linkedin.com/company/companyname/"
            />
            <p className="text-xs text-gray-500 mt-1">One URL per line. Supports personal profiles and company pages.</p>
            <button
              type="button"
              onClick={() => setIsFindInfluencersOpen(true)}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
            >
              🔍 Find Influencers
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Limit
            </label>
            <input
              type="number"
              value={influencerForm.dailyLimit}
              onChange={(e) => setInfluencerForm({ ...influencerForm, dailyLimit: parseInt(e.target.value) || 50 })}
              min="1"
              max="500"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Max posts to engage per day</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800">📌 How it works:</p>
            <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>Monitors each influencer for new posts</li>
              <li>Only processes posts created after campaign start</li>
              <li>Likes and adds an AI-generated comment to each new post</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" className="flex-1 btn-primary">
              {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
            </button>
            <button type="button" onClick={() => { setIsModalOpen(false); resetInfluencerForm(); }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* ===================================================== */}
      {/* COMMENT REPLY CAMPAIGN MODAL */}
      {/* ===================================================== */}
      <Modal
        isOpen={isModalOpen && modalType === 'commentreply'}
        onClose={() => { setIsModalOpen(false); resetCommentReplyForm(); }}
        title="Create Comment Reply Campaign"
        maxWidth="lg"
      >
        <form onSubmit={handleCommentReplySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              value={commentReplyForm.name}
              onChange={(e) => setCommentReplyForm({ ...commentReplyForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="e.g., Engage My Audience"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your LinkedIn Profile URL *
            </label>
            <input
              type="url"
              value={commentReplyForm.ownProfileUrl}
              onChange={(e) => setCommentReplyForm({ ...commentReplyForm, ownProfileUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="https://www.linkedin.com/in/yourusername/"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Your own LinkedIn profile URL</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Age (Days)
            </label>
            <input
              type="number"
              value={commentReplyForm.maxAgeDays}
              onChange={(e) => setCommentReplyForm({ ...commentReplyForm, maxAgeDays: parseInt(e.target.value) || 7 })}
              min="1"
              max="30"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Only process posts from the last X days</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Limit
            </label>
            <input
              type="number"
              value={commentReplyForm.dailyLimit}
              onChange={(e) => setCommentReplyForm({ ...commentReplyForm, dailyLimit: parseInt(e.target.value) || 50 })}
              min="1"
              max="500"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Max comment replies per day</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800">📌 How it works:</p>
            <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>Fetches your recent LinkedIn posts</li>
              <li>Checks for new comments on each post</li>
              <li>Uses AI to generate thoughtful replies to each comment</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" className="flex-1 btn-primary">Create Campaign</button>
            <button type="button" onClick={() => { setIsModalOpen(false); resetCommentReplyForm(); }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* ===================================================== */}
      {/* MARKET CONNECTIONS CAMPAIGN MODAL */}
      {/* ===================================================== */}
      <Modal
        isOpen={isModalOpen && modalType === 'marketconnections'}
        onClose={() => { setIsModalOpen(false); resetMarketConnectionsForm(); }}
        title="Create Message to First Connections Campaign"
        maxWidth="lg"
      >
        <form onSubmit={handleMarketConnectionsSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              value={marketConnectionsForm.name}
              onChange={(e) => setMarketConnectionsForm({ ...marketConnectionsForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="e.g., Product Launch Outreach"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Only the name can be modified after the campaign is completed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords for People Search *
            </label>
            <input
              type="text"
              value={marketConnectionsForm.keywords}
              onChange={(e) => setMarketConnectionsForm({ ...marketConnectionsForm, keywords: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="e.g., CEO, Founder, Marketing Director, Sales"
            />
            <p className="text-xs text-gray-500 mt-1">Separate keywords with commas. These will be used to search your first-level connections.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Template *
            </label>
            <textarea
              value={marketConnectionsForm.messageTemplate}
              onChange={(e) => setMarketConnectionsForm({ ...marketConnectionsForm, messageTemplate: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
              placeholder="Hi {name}, I noticed you're a {title} at {company}. I'd love to connect and discuss..."
            />
            <p className="text-xs text-gray-500 mt-1">Use {'{name}'}, {'{title}'}, {'{company}'} as placeholders. These will be replaced with the recipient's info.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Messages Per Day
              </label>
              <input
                type="number"
                value={marketConnectionsForm.dailyLimit}
                onChange={(e) => setMarketConnectionsForm({ ...marketConnectionsForm, dailyLimit: parseInt(e.target.value) || 50 })}
                min="1"
                max="500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Max messages to send per day (LinkedIn limits apply)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Total Messages
              </label>
              <input
                type="number"
                value={marketConnectionsForm.maxMessages}
                onChange={(e) => setMarketConnectionsForm({ ...marketConnectionsForm, maxMessages: e.target.value })}
                min="1"
                max="10000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Unlimited"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800">📌 How it works:</p>
            <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>Searches your first-level connections using the keywords provided</li>
              <li>Only sends to people who haven't received a message in this campaign before</li>
              <li>Respects LinkedIn's daily messaging limits</li>
              <li>Processes once per day with up to your daily limit</li>
              <li>Once completed, the campaign can only have its name modified</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" className="flex-1 btn-primary">Create Campaign</button>
            <button type="button" onClick={() => { setIsModalOpen(false); resetMarketConnectionsForm(); }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* ===================================================== */}
      {/* FIND INFLUENCERS MODAL */}
      {/* ===================================================== */}
      <Modal
        isOpen={isFindInfluencersOpen}
        onClose={() => { setIsFindInfluencersOpen(false); setSearchResults([]); setSelectedInfluencers([]); }}
        title="🔍 Find Influencers"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords *
            </label>
            <input
              type="text"
              value={influencerSearchData.keywords}
              onChange={(e) => setInfluencerSearchData({ ...influencerSearchData, keywords: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="e.g., AI automation, B2B sales, marketing"
            />
            <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Reactions (Likes)
              </label>
              <input
                type="number"
                value={influencerSearchData.minReactions}
                onChange={(e) => setInfluencerSearchData({ ...influencerSearchData, minReactions: parseInt(e.target.value) || 40 })}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Followers
              </label>
              <input
                type="number"
                value={influencerSearchData.minFollowers}
                onChange={(e) => setInfluencerSearchData({ ...influencerSearchData, minFollowers: parseInt(e.target.value) || 50000 })}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Post Age
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="postAge"
                  value="past_week"
                  checked={influencerSearchData.postAge === 'past_week'}
                  onChange={(e) => setInfluencerSearchData({ ...influencerSearchData, postAge: e.target.value })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm">Past Week</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="postAge"
                  value="past_month"
                  checked={influencerSearchData.postAge === 'past_month'}
                  onChange={(e) => setInfluencerSearchData({ ...influencerSearchData, postAge: e.target.value })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm">Past Month</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSearchInfluencers}
            disabled={searchingInfluencers}
            className="w-full btn-primary"
          >
            {searchingInfluencers ? 'Searching...' : 'Search'}
          </button>

          {searchResults.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Found {searchResults.length} influencers
                </span>
                <button
                  type="button"
                  onClick={addSelectedInfluencers}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                >
                  Add Selected ({selectedInfluencers.length})
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {searchResults.map((influencer, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedInfluencers.some(i => i.profileUrl === influencer.profileUrl)}
                      onChange={() => toggleInfluencerSelection(influencer)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1 min-w-0">
                      <a
                        href={influencer.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {influencer.name}
                        <span className="text-xs text-gray-400 ml-1">🔗</span>
                      </a>
                      <div className="text-xs text-gray-500">
                        {influencer.followerCount?.toLocaleString()} followers
                        {influencer.headline && (
                          <span className="block text-gray-600 mt-0.5">{influencer.headline}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const urlSet = new Set(influencerForm.influencerUrls.split('\n').map(u => u.trim()).filter(Boolean));
                        urlSet.add(influencer.profileUrl);
                        setInfluencerForm({
                          ...influencerForm,
                          influencerUrls: Array.from(urlSet).join('\n')
                        });
                        setIsFindInfluencersOpen(false);
                        setSearchResults([]);
                        setSelectedInfluencers([]);
                        showToast(`Added ${influencer.name} to campaign`, 'success');
                      }}
                      className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchingInfluencers && (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full"></div>
              <p className="text-gray-500 mt-2">Searching for influencers...</p>
            </div>
          )}

          {searchResults.length === 0 && !searchingInfluencers && (
            <div className="text-center py-8 text-gray-500">
              <p>Enter keywords and click search to find influencers</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}