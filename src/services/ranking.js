import { api } from './api';

export const rankingService = {
  // Submit a ranking request
  async submitRanking(email, linkedinUrl, role) {
    try {
      const response = await api.post('/api/audit', {
        email,
        url: linkedinUrl,
        role
      });
      return { success: true, data: response.data };
    } catch (error) {
      // Check if it's a rate limit error
      const isRateLimit = error.response?.status === 429;
      const errorMessage = error.response?.data?.error || 'Failed to submit ranking request';
      
      if (isRateLimit) {
        return {
          success: false,
          error: 'Rate limit exceeded. You have already used your daily ranking.',
          isRateLimit: true
        };
      }
      
      return {
        success: false,
        error: errorMessage,
        isRateLimit: false
      };
    }
  },

  // Check rate limit status
  async checkRateLimit(email) {
    try {
      const response = await api.get(`/api/audit/check?email=${encodeURIComponent(email)}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to check rate limit'
      };
    }
  }
};