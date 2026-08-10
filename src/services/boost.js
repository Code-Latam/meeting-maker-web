import { api } from './api';

export const boostService = {
  // Get today's boosted post
  async getBoostedPost() {
    try {
      const response = await api.get('/linkedin/boosted-post');
      return { success: true, post: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch boosted post'
      };
    }
  },

  // Submit a post to be boosted
  async submitPost(postUrl, isOwnPost = false) {
    try {
      const response = await api.post('/linkedin/boosted-post', {
        postUrl,
        isOwnPost
      });
      return { success: true, post: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to submit post'
      };
    }
  },

  // Delete a boosted post
  async deletePost(postId) {
    try {
      await api.delete(`/linkedin/boosted-post/${postId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete post'
      };
    }
  },

  // Refresh post status
  async refreshStatus(postId) {
    try {
      const response = await api.get(`/linkedin/boosted-post/${postId}`);
      return { success: true, post: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to refresh status'
      };
    }
  }
};