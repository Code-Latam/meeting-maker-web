import { api } from './api';

export const authService = {
  // Login
  async login(email, password) {
    console.log('🔐 authService.login called with:', { email });
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('📥 Login response:', response.data);
      
      if (response.data.token) {
        console.log('✅ Token received, storing data...');
        
        // Extract client data - try multiple paths
        let clientData = null;
        if (response.data.client) {
          clientData = response.data.client;
        } else if (response.data.user?.client) {
          clientData = response.data.user.client;
        }
        
        console.log('📦 Extracted client data:', clientData);
        console.log('📦 Client name:', clientData?.name);
        
        localStorage.setItem('jwt', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Store client data if it exists
        if (clientData) {
          localStorage.setItem('client', JSON.stringify(clientData));
          console.log('✅ Client data stored in localStorage');
        } else {
          console.warn('⚠️ No client data found in response');
          localStorage.removeItem('client');
        }
        
        // Verify storage
        const storedClient = localStorage.getItem('client');
        console.log('✅ Verified stored client:', storedClient);
        if (storedClient) {
          const parsedClient = JSON.parse(storedClient);
          console.log('✅ Parsed client name:', parsedClient?.name);
        }
        
        return { 
          success: true, 
          user: response.data.user,
          client: clientData
        };
      }
      
      console.log('❌ No token in response');
      return { success: false, error: 'No token received' };
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Login failed'
      };
    }
  },

  // Logout
  logout() {
    console.log('🚪 authService.logout called');
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
    } catch (error) {
      console.error('❌ Error parsing user:', error);
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