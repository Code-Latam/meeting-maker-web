import { api } from './api';

export const setupService = {
  // Get setup completeness status for the current client
  async getSetupStatus() {
    try {
      const response = await api.get('/setup/status');
      return { success: true, items: response.data.items || [] };
    } catch (error) {
      return {
        success: false,
        items: [],
        error: error.response?.data?.error || 'Failed to fetch setup status'
      };
    }
  }
};
