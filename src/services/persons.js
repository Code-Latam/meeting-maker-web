import { api } from './api';

export const personsService = {
  // Get all persons for an agent with filters
  async getPersons(agentId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.groupId) queryParams.append('groupId', params.groupId);
      if (params.lifecycleState) queryParams.append('lifecycleState', params.lifecycleState);
      if (params.search) queryParams.append('search', params.search);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.funnel) queryParams.append('funnel', params.funnel);

      const url = `/people/agent/${agentId}/threads?${queryParams.toString()}`;
      const response = await api.get(url);
      
      return { 
        success: true, 
        items: response.data.items || [],
        pageInfo: response.data.pageInfo || { total: 0, page: 1, pages: 1 }
      };
    } catch (error) {
      console.error('Error fetching persons:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch persons'
      };
    }
  },

  // Get groups for an agent
  async getGroups(agentId) {
    try {
      const response = await api.get(`/people/agent/${agentId}/groups`);
      return { success: true, groups: response.data.groups || [] };
    } catch (error) {
      console.error('Error fetching groups:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch groups'
      };
    }
  },

  // Get all persons (for state extraction)
  async getAllPersons(agentId) {
    try {
      let allItems = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await api.get(`/people/agent/${agentId}/threads?page=${page}&limit=100`);
        const items = response.data.items || [];
        allItems = [...allItems, ...items];
        
        const pageInfo = response.data.pageInfo || {};
        hasMore = page < pageInfo.pages;
        page++;
      }

      return { success: true, items: allItems };
    } catch (error) {
      console.error('Error fetching all persons:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch all persons'
      };
    }
  },

  // Get a single person by ID
  async getPerson(agentId, personId) {
    try {
      const response = await api.get(`/people/agent/${agentId}/person/${personId}`);
      return { success: true, person: response.data.person };
    } catch (error) {
      console.error('Error fetching person:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch person'
      };
    }
  },

  // Update person's lifecycle state
  async updateLifecycleState(agentId, personId, funnel, state, reason = 'manual_extension_action') {
    try {
      const response = await api.patch(`/people/agent/${agentId}/person/${personId}/lifecycle`, {
        funnel,
        state,
        reason
      });
      return { success: true, person: response.data.person };
    } catch (error) {
      console.error('Error updating lifecycle state:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update lifecycle state'
      };
    }
  },

  // Update person's group
  async updatePersonGroup(agentId, personId, groupId) {
    try {
      const response = await api.patch(`/people/agent/${agentId}/person/${personId}/group`, {
        groupId
      });
      return { success: true, person: response.data.person };
    } catch (error) {
      console.error('Error updating person group:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update person group'
      };
    }
  },

  // Remove person from agent
  async removePersonFromAgent(agentId, personId) {
    try {
      const response = await api.delete(`/people/agent/${agentId}/person/${personId}`);
      return { success: true };
    } catch (error) {
      console.error('Error removing person from agent:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to remove person from agent'
      };
    }
  },

  // Get person's deal history
  async getPersonDeals(agentId, personId) {
    try {
      const response = await api.get(`/people/agent/${agentId}/person/${personId}/deals`);
      return { success: true, deals: response.data.deals || [] };
    } catch (error) {
      console.error('Error fetching person deals:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch person deals'
      };
    }
  },

  // Get person's communication history
  async getPersonCommunications(agentId, personId, funnel) {
    try {
      const response = await api.get(`/people/agent/${agentId}/person/${personId}/communications?funnel=${funnel}`);
      return { success: true, communications: response.data.communications || [] };
    } catch (error) {
      console.error('Error fetching person communications:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch person communications'
      };
    }
  },

  // Bulk update persons (e.g., change group for multiple persons)
  async bulkUpdatePersons(agentId, personIds, updates) {
    try {
      const response = await api.patch(`/people/agent/${agentId}/bulk`, {
        personIds,
        updates
      });
      return { success: true, updated: response.data.updated || 0 };
    } catch (error) {
      console.error('Error bulk updating persons:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to bulk update persons'
      };
    }
  },

  // Export persons data
  async exportPersons(agentId, format = 'csv', filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      if (filters.groupId) queryParams.append('groupId', filters.groupId);
      if (filters.lifecycleState) queryParams.append('lifecycleState', filters.lifecycleState);
      if (filters.funnel) queryParams.append('funnel', filters.funnel);
      
      const response = await api.get(`/people/agent/${agentId}/export?${queryParams.toString()}`, {
        responseType: 'blob'
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error exporting persons:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to export persons'
      };
    }
  }
};