import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth';
import { api } from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      client: null,
      agencyClient: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isChildClient: false, // ✅ NEW: Store whether user is a child client
      
      login: async (email, password) => {
        console.log('🔐 Login started...');
        set({ isLoading: true });
        const result = await authService.login(email, password);
        
        if (result.success) {
          console.log('✅ Login successful!');
          
          let clientData = result.client || result.user?.client;
          
          // Fetch full client data from /me
          try {
            console.log('📦 Fetching full client data from /me...');
            const meResponse = await api.get('/auth/me');
            if (meResponse.data?.client) {
              clientData = { ...clientData, ...meResponse.data.client };
            }
          } catch (meError) {
            console.error('❌ Failed to fetch /me:', meError);
          }
          
          // ✅ Check if user is a child client
          const isChildClient = clientData?.parentClientId !== null && 
                               clientData?.parentClientId !== undefined;
          localStorage.setItem('isChildClient', JSON.stringify(isChildClient));
          
          // Store agency client if this user is an agency
          let agencyClient = null;
          if (clientData?.isAgency) {
            agencyClient = { ...clientData };
            localStorage.setItem('agencyClient', JSON.stringify(agencyClient));
            console.log('✅ Agency client stored:', agencyClient.name);
          }
          
          set({
            user: result.user,
            client: clientData,
            agencyClient: agencyClient,
            token: localStorage.getItem('jwt'),
            isAuthenticated: true,
            isLoading: false,
            isChildClient: isChildClient,
          });
          
          console.log('📦 Auth state:', {
            clientName: clientData?.name,
            isAgency: clientData?.isAgency,
            isChildClient: isChildClient,
            agencyClient: agencyClient?.name,
          });
          
        } else {
          console.log('❌ Login failed:', result.error);
          set({ isLoading: false });
        }
        return result;
      },
      
      logout: () => {
        console.log('🚪 Logging out...');
        authService.logout();
        localStorage.removeItem('agencyClient');
        localStorage.removeItem('activeClientId');
        localStorage.removeItem('activeClientName');
        localStorage.removeItem('isChildClient');
        useAppStore.getState().clearActiveClient();
        set({ 
          user: null, 
          client: null,
          agencyClient: null,
          token: null, 
          isAuthenticated: false,
          isChildClient: false,
        });
      },
      
      checkAuth: () => {
        console.log('🔍 Checking auth...');
        const token = localStorage.getItem('jwt');
        
        if (!token) {
          console.log('❌ No token found');
          set({ 
            user: null, 
            client: null,
            agencyClient: null,
            token: null, 
            isAuthenticated: false,
            isLoading: false,
            isChildClient: false,
          });
          return false;
        }

        const user = authService.getCurrentUser();
        
        let client = null;
        let agencyClient = null;
        let isChildClient = false;
        
        try {
          const clientData = localStorage.getItem('client');
          if (clientData) client = JSON.parse(clientData);
          const agencyData = localStorage.getItem('agencyClient');
          if (agencyData) agencyClient = JSON.parse(agencyData);
          // ✅ Restore isChildClient from localStorage
          const childData = localStorage.getItem('isChildClient');
          if (childData) isChildClient = JSON.parse(childData);
        } catch (e) {
          console.error('Error parsing client data:', e);
        }
        
        // ✅ Restore the selected client from localStorage
        const savedActiveClientId = localStorage.getItem('activeClientId');
        const savedActiveClientName = localStorage.getItem('activeClientName');
        
        if (savedActiveClientId && agencyClient) {
          if (savedActiveClientId === agencyClient._id) {
            // Viewing agency
            client = { ...agencyClient };
            console.log('✅ Restored agency client:', client.name);
          } else {
            // Viewing a child - create a minimal client object
            client = {
              ...client,
              _id: savedActiveClientId,
              name: savedActiveClientName || 'Child Client',
              isAgency: false,
            };
            console.log('✅ Restored child client:', client.name);
          }
        } else if (agencyClient) {
          // Default to agency
          client = { ...agencyClient };
          console.log('✅ Default to agency client:', client.name);
        }
        
        if (token && user) {
          set({
            user,
            client,
            agencyClient,
            token,
            isAuthenticated: true,
            isLoading: false,
            isChildClient: isChildClient,
          });
          return true;
        } else {
          set({
            user: null,
            client: null,
            agencyClient: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            isChildClient: false,
          });
          return false;
        }
      },
      
      refreshClient: async () => {
        try {
          console.log('🔄 Refreshing client data from /me...');
          const response = await api.get('/auth/me');
          if (response.data?.client) {
            const clientData = response.data.client;
            localStorage.setItem('client', JSON.stringify(clientData));
            set({ client: clientData });
            console.log('✅ Client data refreshed:', clientData);
            return clientData;
          }
        } catch (error) {
          console.error('❌ Failed to refresh client:', error);
        }
        return null;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

// ============================================================
// APP STORE - For client switching
// ============================================================
export const useAppStore = create(
  persist(
    (set) => ({
      activeClientId: null,
      setActiveClientId: (clientId) => {
        console.log('📦 setActiveClientId:', clientId);
        set({ activeClientId: clientId });
        if (clientId) {
          localStorage.setItem('activeClientId', clientId);
        } else {
          localStorage.removeItem('activeClientId');
        }
      },
      clearActiveClient: () => {
        console.log('📦 clearActiveClient');
        set({ activeClientId: null });
        localStorage.removeItem('activeClientId');
        localStorage.removeItem('activeClientName');
      },
    }),
    {
      name: 'app-storage',
    }
  )
);

// ============================================================
// UI STORE
// ============================================================
export const useUIStore = create((set) => ({
  isMobile: window.innerWidth < 1024,
  isSidebarOpen: window.innerWidth >= 1024,
  activeTab: 'agents',
  toast: null,
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setMobile: (isMobile) => set({ isMobile }),
  showToast: (message, type = 'info') => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
}));

// ============================================================
// BLOG STORE
// ============================================================
export { useBlogStore } from './blogStore';

// Handle window resize
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    const isMobile = window.innerWidth < 1024;
    useUIStore.getState().setMobile(isMobile);
  });
}