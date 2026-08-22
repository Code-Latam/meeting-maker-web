// src/store/blogStore.js

import { create } from 'zustand';
import { api } from '../services/api';

export const useBlogStore = create((set, get) => ({
  // Settings
  blogEnabled: false,
  blogType: 'widget',
  blogTitle: 'Blog',
  blogLayout: 'grid',
  customDomain: '',
  ssrSubdomain: '',
  ssrCustomDomain: '',
  postLinkedIn: false,
  linkedinTemplate: null,
  linkedinPublishingWorkflow: 'auto',
  publishingWorkflow: 'auto',

  // Articles
  articles: [],
  articlesLoading: false,
  articlesTotal: 0,
  articlesPage: 1,
  articlesTotalPages: 0,
  articlesStatusFilter: 'all',

  // LinkedIn Posts
  linkedinPosts: [],
  linkedinPostsLoading: false,
  linkedinPostsTotal: 0,
  linkedinPostsPage: 1,
  linkedinPostsTotalPages: 0,
  linkedinPostsStatusFilter: 'all',

  // Upload state
  uploading: false,

  // Fetch all blog settings
  fetchSettings: async () => {
    try {
      const response = await api.get('/blog/ssr/dashboard/settings');
      const data = response.data;
      set({
        blogEnabled: data.enabled || false,
        blogType: data.type || 'widget',
        blogTitle: data.title || 'Blog',
        blogLayout: data.layout || 'grid',
        customDomain: data.customDomain || '',
        ssrSubdomain: data.ssrSubdomain || '',
        ssrCustomDomain: data.ssrCustomDomain || '',
        linkedinPublishingWorkflow: data.linkedinPublishingWorkflow || 'auto',
        postLinkedIn: data.postLinkedIn || false,
      });
      return data;
    } catch (error) {
      console.error('Failed to fetch blog settings:', error);
      throw error;
    }
  },

  // Update blog settings
  updateSettings: async (updates) => {
    try {
      const response = await api.put('/blog/ssr/dashboard/settings', updates);
      const data = response.data;
      set({
        blogEnabled: data.enabled !== undefined ? data.enabled : get().blogEnabled,
        blogType: data.type || get().blogType,
        blogTitle: data.title || get().blogTitle,
        blogLayout: data.layout || get().blogLayout,
        customDomain: data.customDomain || '',
        ssrSubdomain: data.ssrSubdomain || '',
        ssrCustomDomain: data.ssrCustomDomain || '',
        linkedinPublishingWorkflow: data.linkedinPublishingWorkflow || 'auto',
        postLinkedIn: data.postLinkedIn !== undefined ? data.postLinkedIn : get().postLinkedIn,
      });
      return data;
    } catch (error) {
      console.error('Failed to update blog settings:', error);
      throw error;
    }
  },

  // Fetch articles
  fetchArticles: async (page = 1, status = 'all') => {
    set({ articlesLoading: true });
    try {
      const response = await api.get(`/blog/dashboard/articles?page=${page}&limit=10&status=${status}`);
      const data = response.data;
      set({
        articles: data.articles || [],
        articlesTotal: data.total || 0,
        articlesPage: data.page || 1,
        articlesTotalPages: data.totalPages || 0,
        articlesStatusFilter: status,
        articlesLoading: false,
      });
      return data;
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      set({ articlesLoading: false });
      throw error;
    }
  },

  // Update article
  updateArticle: async (articleId, data) => {
    try {
      const response = await api.put(`/blog/dashboard/articles/${articleId}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update article:', error);
      throw error;
    }
  },

  // Submit article
  submitArticle: async (articleId) => {
    try {
      const response = await api.post(`/blog/dashboard/articles/${articleId}/submit`);
      return response.data;
    } catch (error) {
      console.error('Failed to submit article:', error);
      throw error;
    }
  },

  // Fetch LinkedIn posts
  fetchLinkedInPosts: async (page = 1, status = 'all') => {
    set({ linkedinPostsLoading: true });
    try {
      const response = await api.get(`/blog/dashboard/linkedin-posts?page=${page}&limit=10&status=${status}`);
      const data = response.data;
      set({
        linkedinPosts: data.posts || [],
        linkedinPostsTotal: data.total || 0,
        linkedinPostsPage: data.page || 1,
        linkedinPostsTotalPages: data.totalPages || 0,
        linkedinPostsStatusFilter: status,
        linkedinPostsLoading: false,
      });
      return data;
    } catch (error) {
      console.error('Failed to fetch LinkedIn posts:', error);
      set({ linkedinPostsLoading: false });
      throw error;
    }
  },

  // Update LinkedIn post
  updateLinkedInPost: async (postId, text) => {
    try {
      const response = await api.put(`/blog/dashboard/linkedin-posts/${postId}`, { text });
      return response.data;
    } catch (error) {
      console.error('Failed to update LinkedIn post:', error);
      throw error;
    }
  },

  // Submit LinkedIn post
  submitLinkedInPost: async (postId) => {
    try {
      const response = await api.post(`/blog/dashboard/linkedin-posts/${postId}/submit`);
      return response.data;
    } catch (error) {
      console.error('Failed to submit LinkedIn post:', error);
      throw error;
    }
  },

  // Publish LinkedIn post
  publishLinkedInPost: async (postId) => {
    try {
      const response = await api.post(`/blog/dashboard/linkedin-posts/${postId}/publish`);
      return response.data;
    } catch (error) {
      console.error('Failed to publish LinkedIn post:', error);
      throw error;
    }
  },

  // Toggle LinkedIn posting
  toggleLinkedInPosting: async (enabled) => {
    try {
      const response = await api.put('/blog/linkedin-posting', { enabled });
      set({ postLinkedIn: enabled });
      return response.data;
    } catch (error) {
      console.error('Failed to toggle LinkedIn posting:', error);
      throw error;
    }
  },

  // Upload template
  uploadTemplate: async (file) => {
    set({ uploading: true });
    try {
      const formData = new FormData();
      formData.append('template', file);
      const response = await api.post('/blog/linkedin-template', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({ linkedinTemplate: response.data.imageUrl, uploading: false });
      return response.data;
    } catch (error) {
      console.error('Failed to upload template:', error);
      set({ uploading: false });
      throw error;
    }
  },

  // Remove template
  removeTemplate: async () => {
    try {
      await api.delete('/blog/linkedin-template');
      set({ linkedinTemplate: null });
    } catch (error) {
      console.error('Failed to remove template:', error);
      throw error;
    }
  },

  // Fetch LinkedIn template
  fetchLinkedInTemplate: async () => {
    try {
      const response = await api.get('/blog/linkedin-template');
      set({ 
        linkedinTemplate: response.data.templateUrl || null,
        postLinkedIn: response.data.postLinkedIn || false,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch LinkedIn template:', error);
      throw error;
    }
  },

  // Enable/disable blog
  toggleBlog: async (enabled) => {
    try {
      const endpoint = enabled ? '/blog/enable' : '/blog/disable';
      const response = await api.post(endpoint);
      set({ blogEnabled: enabled });
      return response.data;
    } catch (error) {
      console.error('Failed to toggle blog:', error);
      throw error;
    }
  },
}));