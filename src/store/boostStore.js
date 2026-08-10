import { create } from 'zustand';
import { boostService } from '../services/boost';

export const useBoostStore = create((set, get) => ({
  post: null,
  isLoading: false,
  error: null,
  isSubmitting: false,

  // Load today's boosted post
  loadBoostedPost: async () => {
    set({ isLoading: true, error: null });
    const result = await boostService.getBoostedPost();
    if (result.success) {
      set({ 
        post: result.post.hasPost ? result.post.post : null,
        isLoading: false 
      });
    } else {
      set({ error: result.error, isLoading: false });
    }
    return result;
  },

  // Submit a new post
  submitPost: async (postUrl, isOwnPost) => {
    set({ isSubmitting: true, error: null });
    const result = await boostService.submitPost(postUrl, isOwnPost);
    if (result.success) {
      set({ 
        post: result.post,
        isSubmitting: false 
      });
    } else {
      set({ error: result.error, isSubmitting: false });
    }
    return result;
  },

  // Delete a post
  deletePost: async (postId) => {
    set({ isLoading: true, error: null });
    const result = await boostService.deletePost(postId);
    if (result.success) {
      set({ post: null, isLoading: false });
    } else {
      set({ error: result.error, isLoading: false });
    }
    return result;
  },

  // Refresh post status
  refreshStatus: async (postId) => {
    set({ isLoading: true, error: null });
    const result = await boostService.refreshStatus(postId);
    if (result.success) {
      set({ post: result.post, isLoading: false });
    } else {
      set({ error: result.error, isLoading: false });
    }
    return result;
  },

  // Clear error
  clearError: () => set({ error: null })
}));