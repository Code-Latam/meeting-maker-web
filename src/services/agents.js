import { api } from './api';

export const agentsService = {
  // Get all agents
  async getAgents() {
    try {
      const response = await api.get('/agents');
      return { success: true, agents: response.data.agents || [] };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch agents'
      };
    }
  },

  // Get a single agent
  async getAgent(id) {
    try {
      const response = await api.get(`/agents/${id}`);
      return { success: true, agent: response.data.agent };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch agent'
      };
    }
  },

  // Create a new agent
  async createAgent(data) {
    try {
      const response = await api.post('/agents', data);
      return { success: true, agent: response.data.agent };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create agent'
      };
    }
  },

  // Update an agent
  async updateAgent(id, data) {
    try {
      const response = await api.put(`/agents/${id}`, data);
      return { success: true, agent: response.data.agent };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update agent'
      };
    }
  },

  // Delete an agent
  async deleteAgent(id) {
    try {
      await api.delete(`/agents/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete agent'
      };
    }
  },

  // Get agent categories/roles
  async getAgentCategories() {
    try {
      const response = await api.get('/agents/agentCategories');
      return { success: true, categories: response.data.categories || [] };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch categories'
      };
    }
  },

  // Generate persona using website data
  async generatePersona(role, websiteData) {
    try {
      const response = await api.post('/agents/generate-persona', {
        role,
        websiteData
      });
      return { success: true, persona: response.data.persona };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to generate persona'
      };
    }
  },

  // Generate services using website data
  async generateServices(websiteData) {
    try {
      const response = await api.post('/agents/generate-services', {
        websiteData
      });
      return { success: true, services: response.data.services };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to generate services'
      };
    }
  },

  // Get LinkedIn lead counts for all agents
async getLeadCounts() {
  try {
    const response = await api.get('/people/agent-lead-counts');
    return { success: true, counts: response.data.counts || {} };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch lead counts'
    };
  }
},

// Get email lead counts for all agents
async getEmailLeadCounts() {
  try {
    const response = await api.get('/people/agent-email-lead-counts');
    return { success: true, counts: response.data.counts || {} };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch email lead counts'
    };
  }
},

// Get article counts (for SEO Manager)
async getArticleCounts() {
  try {
    const response = await api.get('/blog/agents/article-counts');
    return { success: true, counts: response.data.counts || {} };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch article counts'
    };
  }
},

  // Fetch website info
  async fetchWebsiteInfo(url) {
    try {
      const response = await api.post('/api/websites', {
        url,
        forceRefresh: true,
        isPrimary: false
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch website info'
      };
    }
  }
};