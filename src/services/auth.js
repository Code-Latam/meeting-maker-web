import { api } from './api';

export const authService = {
  // Login
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.token) {
        localStorage.setItem('jwt', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('client', JSON.stringify(response.data.client));
        return { 
          success: true, 
          user: response.data.user,
          client: response.data.client
        };
      }
      
      return { success: false, error: 'No token received' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Login failed'
      };
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    localStorage.removeItem('client');
    window.location.href = '/login';
  },

  // Get current user
  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('jwt');
  },

  // Get JWT token
  getToken() {
    return localStorage.getItem('jwt');
  },

  // Fetch user profile
  async getProfile() {
    try {
      const response = await api.get('/auth/me');
      return { success: true, user: response.data.user, client: response.data.client };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch profile'
      };
    }
  }
};