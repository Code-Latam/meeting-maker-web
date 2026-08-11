import { api } from './api';

export const campaignsService = {
  // =====================================================
  // SEARCH CAMPAIGNS (Lead Generation)
  // =====================================================
  
  // Get all search campaigns for an agent
  async getSearchCampaigns(agentId) {
    try {
      const response = await api.get(`/lead-campaigns/campaigns/agent/${agentId}`);
      return { success: true, campaigns: response.data.campaigns || [] };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch campaigns'
      };
    }
  },

  // Create a search campaign
  async createSearchCampaign(data) {
    try {
      const response = await api.post('/lead-campaigns/campaigns', data);
      return { success: true, campaign: response.data.campaign };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create campaign'
      };
    }
  },

  // Update a search campaign
  async updateSearchCampaign(id, data) {
    try {
      const response = await api.patch(`/lead-campaigns/campaigns/${id}`, data);
      return { success: true, campaign: response.data.campaign };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update campaign'
      };
    }
  },

  // Delete a search campaign
  async deleteSearchCampaign(id) {
    try {
      await api.delete(`/lead-campaigns/campaigns/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete campaign'
      };
    }
  },

  // =====================================================
  // POST CAMPAIGNS
  // =====================================================
  
  // Get all post campaigns for an agent
  async getPostCampaigns(agentId) {
    try {
      const response = await api.get(`/lead-campaigns/post-campaigns/agent/${agentId}`);
      return { success: true, campaigns: response.data.campaigns || [] };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch post campaigns'
      };
    }
  },

  // Create a post campaign
  async createPostCampaign(data) {
    try {
      const response = await api.post('/lead-campaigns/post-campaigns', data);
      return { success: true, campaign: response.data.campaign };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create post campaign'
      };
    }
  },

  // Update a post campaign
  async updatePostCampaign(id, data) {
    try {
      const response = await api.patch(`/lead-campaigns/post-campaigns/${id}`, data);
      return { success: true, campaign: response.data.campaign };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update post campaign'
      };
    }
  },

  // Delete a post campaign
  async deletePostCampaign(id) {
    try {
      await api.delete(`/lead-campaigns/post-campaigns/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete post campaign'
      };
    }
  },

  // =====================================================
  // KEYWORD ENGAGEMENT CAMPAIGNS (Marketing)
  // =====================================================
  
  async getKeywordCampaigns(agentId) {
    try {
      const response = await api.get(`/lead-campaigns/keyword-engagement/agent/${agentId}`);
      return { success: true, campaigns: response.data.campaigns || [] };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch keyword campaigns'
      };
    }
  },

  async createKeywordCampaign(data) {
    try {
      const response = await api.post('/lead-campaigns/keyword-engagement', data);
      return { success: true, campaign: response.data.campaign };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create keyword campaign'
      };
    }
  },

  async updateKeywordCampaign(id, data) {
    try {
      const response = await api.patch(`/lead-campaigns/keyword-engagement/${id}`, data);
      return { success: true, campaign: response.data.campaign };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update keyword campaign'
      };
    }
  },

  async deleteKeywordCampaign(id) {
    try {
      await api.delete(`/lead-campaigns/keyword-engagement/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete keyword campaign'
      };
    }
  },

  // =====================================================
  // INFLUENCER ENGAGEMENT CAMPAIGNS (Marketing)
  // =====================================================
  
  async getInfluencerCampaigns(agentId) {
    try {
      const response = await api.get(`/lead-campaigns/influencer-engagement/agent/${agentId}`);
      return { success: true, campaigns: response.data.campaigns || [] };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch influencer campaigns'
      };
    }
  },

  async createInfluencerCampaign(data) {
    try {
      const response = await api.post('/lead-campaigns/influencer-engagement', data);
      return { success: true, campaign: response.data.campaign };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create influencer campaign'
      };
    }
  },

  async updateInfluencerCampaign(id, data) {
    try {
      const response = await api.put(`/lead-campaigns/influencer-engagement/${id}`, data);
      return { success: true, campaign: response.data.campaign };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update influencer campaign'
      };
    }
  },

  async deleteInfluencerCampaign(id) {
    try {
      await api.delete(`/lead-campaigns/influencer-engagement/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete influencer campaign'
      };
    }
  },

  // =====================================================
  // COMMENT REPLY CAMPAIGNS (Marketing)
  // =====================================================
  
  async getCommentReplyCampaigns(agentId) {
    try {
      const response = await api.get(`/lead-campaigns/comment-reply/agent/${agentId}`);
      return { success: true, campaigns: response.data.campaigns || [] };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch comment reply campaigns'
      };
    }
  },

  async createCommentReplyCampaign(data) {
    try {
      const response = await api.post('/lead-campaigns/comment-reply', data);
      return { success: true, campaign: response.data.campaign };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create comment reply campaign'
      };
    }
  },

  async updateCommentReplyCampaign(id, data) {
    try {
      const response = await api.patch(`/lead-campaigns/comment-reply/${id}`, data);
      return { success: true, campaign: response.data.campaign };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update comment reply campaign'
      };
    }
  },

  async deleteCommentReplyCampaign(id) {
    try {
      await api.delete(`/lead-campaigns/comment-reply/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete comment reply campaign'
      };
    }
  },

  // =====================================================
  // MARKET CONNECTIONS CAMPAIGNS (Message to First Connections)
  // =====================================================
  
  async getMarketConnectionsCampaigns(agentId) {
    try {
      const response = await api.get(`/lead-campaigns/market-connections/agent/${agentId}`);
      return { success: true, campaigns: response.data.campaigns || [] };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch market connections campaigns'
      };
    }
  },

  async createMarketConnectionsCampaign(data) {
    try {
      const response = await api.post('/lead-campaigns/market-connections', data);
      return { success: true, campaign: response.data.campaign };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create market connections campaign'
      };
    }
  },

  async updateMarketConnectionsCampaign(id, data) {
    try {
      const response = await api.patch(`/lead-campaigns/market-connections/${id}`, data);
      return { success: true, campaign: response.data.campaign };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update market connections campaign'
      };
    }
  },

  async deleteMarketConnectionsCampaign(id) {
    try {
      await api.delete(`/lead-campaigns/market-connections/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete market connections campaign'
      };
    }
  },

// =====================================================
// FIND INFLUENCERS (Marketing) lest tet
// =====================================================
  
async findInfluencers(data) {
  try {
    console.log('🔍 Finding influencers with data:', data);
    
    // Use a longer timeout specifically for this request
    const response = await api.post('/lead-campaigns/marketing/find-influencers', data, {
      timeout: 120000 // 120 seconds (2 minutes)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', response.data);
    
    // Handle different response formats
    let influencers = [];
    if (response.data.influencers && Array.isArray(response.data.influencers)) {
      influencers = response.data.influencers;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      influencers = response.data.data;
    } else if (Array.isArray(response.data)) {
      influencers = response.data;
    } else if (response.data.success && response.data.influencers) {
      influencers = response.data.influencers;
    }
    
    console.log('📊 Extracted influencers:', influencers.length);
    
    return { 
      success: true, 
      influencers: influencers 
    };
  } catch (error) {
    console.error('❌ Error finding influencers:', error);
    
    let errorMessage = 'Failed to find influencers';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. The search is taking longer than expected. Please try again.';
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
},
  // =====================================================
  // SEARCH PARAMETERS (Locations, Industries)
  // =====================================================
  
  async getSearchParameters() {
    try {
      const response = await api.get('/lead-campaigns/search-parameters');
      return { 
        success: true, 
        locations: response.data.locations || [],
        industries: response.data.industries || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch search parameters'
      };
    }
  }
};