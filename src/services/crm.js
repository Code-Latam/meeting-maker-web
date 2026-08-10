import { api } from './api';

export const crmService = {
  // ============================================================
  // IMPORTANT CONTACTS
  // ============================================================
  
  // Get all important contacts (kanban board)
  async getImportantContacts() {
    try {
      const response = await api.get('/people/important-contacts');
      return { success: true, people: response.data.people || [] };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to load contacts'
      };
    }
  },

  // Update person type
  async updatePersonType(personId, personType) {
    try {
      const response = await api.patch(`/people/${personId}`, { personType });
      return { success: true, person: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update person type'
      };
    }
  },

  // ============================================================
  // DEALS
  // ============================================================
  
  // Get deals board
  async getDealsBoard(dealType = null) {
    try {
      let url = '/deals/board';
      if (dealType) {
        url += `?dealType=${encodeURIComponent(dealType)}`;
      }
      const response = await api.get(url);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to load deals'
      };
    }
  },

  // Get deal types
  async getDealTypes() {
    try {
      const response = await api.get('/deals/types');
      return { success: true, types: response.data.data || [] };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to load deal types'
      };
    }
  },

  // Create deal type
  async createDealType(name, color) {
    try {
      const response = await api.post('/deals/types', { name, color });
      return { success: true, type: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create deal type'
      };
    }
  },

  // Update deal type
  async updateDealType(typeId, name, color) {
    try {
      const response = await api.put(`/deals/types/${typeId}`, { name, color });
      return { success: true, type: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update deal type'
      };
    }
  },

  // Delete deal type
  async deleteDealType(typeId) {
    try {
      await api.delete(`/deals/types/${typeId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete deal type'
      };
    }
  },

  // Move deal stage
  async moveDealStage(dealId, stage) {
    try {
      const response = await api.patch(`/deals/${dealId}/stage`, { stage });
      return { success: true, deal: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to move deal'
      };
    }
  },

  // Update deal
  async updateDeal(dealId, updates) {
    try {
      const payload = {
        name: updates.name,
        description: updates.description || '',
        dealSize: updates.dealSize || 0,
        stage: updates.stage || 'lead',
        dealType: updates.dealType || null,
        probability: updates.probability || 10,
        expectedCloseDate: updates.expectedCloseDate || null,
        closedReason: updates.closedReason || '',
        actions: updates.actions || []
      };

      const response = await api.put(`/deals/${dealId}`, payload);
      return { success: true, deal: response.data };
    } catch (error) {
      console.error('Update deal error:', error);
      console.error('Response:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update deal'
      };
    }
  },

  // Create deal
  async createDeal(dealData) {
    try {
      const payload = {
        personId: dealData.personId,
        name: dealData.name,
        description: dealData.description || '',
        dealSize: dealData.dealSize || 0,
        stage: dealData.stage || 'lead',
        dealType: dealData.dealType || null,
        probability: dealData.probability || 10,
        expectedCloseDate: dealData.expectedCloseDate || null,
        actions: dealData.actions || []
      };

      const response = await api.post('/deals', payload);
      return { success: true, deal: response.data.data };
    } catch (error) {
      console.error('Create deal error:', error);
      console.error('Response:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create deal'
      };
    }
  },

  // Search people
  async searchPeople(query) {
    try {
      const response = await api.get(`/people?search=${encodeURIComponent(query)}&limit=10`);
      return { success: true, items: response.data.items || [] };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to search people'
      };
    }
  },

  // ============================================================
  // PERSON MANAGEMENT
  // ============================================================

  // Get a single person by ID
  async getPerson(personId) {
    try {
      const response = await api.get(`/people/${personId}`);
      return { success: true, person: response.data.person };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get person'
      };
    }
  },

  // Lookup person by linkedin public ID
  async lookupPerson(linkedinPublicId) {
    try {
      const response = await api.get(`/people/lookup?publicId=${linkedinPublicId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to lookup person'
      };
    }
  },

  // Update person
  async updatePerson(personId, updates) {
    try {
      const response = await api.patch(`/people/${personId}`, updates);
      return { success: true, person: response.data.person };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update person'
      };
    }
  },

  // Update lifecycle state for a specific channel
  async updateLifecycleState(personId, channel, state, reason) {
    try {
      const response = await api.patch(`/people/${personId}/threads/${channel}/lifecycle`, {
        state,
        reason: reason || 'manual_update'
      });
      return { success: true, thread: response.data.thread, person: response.data.person };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update lifecycle state'
      };
    }
  },

  // Update email channel
  async updateEmailChannel(personId, email) {
    try {
      const response = await api.patch(`/people/${personId}/channels/email`, {
        identifiers: { email }
      });
      return { success: true, person: response.data.person };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update email'
      };
    }
  },

  // Update email lifecycle
  async updateEmailLifecycle(personId, state, reason) {
    try {
      const response = await api.patch(`/people/${personId}/threads/email/lifecycle`, {
        state,
        reason: reason || 'manual_update'
      });
      return { success: true, thread: response.data.thread };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update email lifecycle'
      };
    }
  },

  // Get groups for an agent
  async getGroups(agentId) {
    try {
      const response = await api.get(`/people/agent/${agentId}/groups`);
      return { success: true, groups: response.data.groups || [] };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get groups'
      };
    }
  },

  // Create a group
  async createGroup(name) {
    try {
      const response = await api.post('/groups/resolve', { name });
      return { success: true, group: response.data.group };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create group'
      };
    }
  },

  // Get deals for a person
  async getDealsForPerson(personId) {
    try {
      const response = await api.get(`/deals?personId=${personId}`);
      return { success: true, deals: response.data.data || [] };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get deals'
      };
    }
  },

  // Delete a deal
  async deleteDeal(dealId) {
    try {
      await api.delete(`/deals/${dealId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete deal'
      };
    }
  },

  // ============================================================
  // FINANCE
  // ============================================================
  
  // Get finance dashboard
  async getFinanceDashboard() {
    try {
      const response = await api.get('/finance/dashboard');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching finance data:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to load finance data'
      };
    }
  },

  // Create checkout session for payment
  async createCheckoutSession() {
    try {
      const response = await api.post('/finance/create-checkout-session');
      return { 
        success: true, 
        url: response.data.url, 
        amount: response.data.amount 
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create payment session'
      };
    }
  },

  // Get invoice by ID
  async getInvoice(invoiceId) {
    try {
      const response = await api.get(`/finance/invoices/${invoiceId}`);
      return { success: true, invoice: response.data.data };
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to load invoice'
      };
    }
  }
};