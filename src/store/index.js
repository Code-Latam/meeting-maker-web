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
      isChildClient: false,
      
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
          const isActuallyChild = clientData?.parentClientId !== null && 
                                  clientData?.parentClientId !== undefined;
          
          // ✅ NEW: If parent agency allows full access, child gets full access
          const parentAllowsFullAccess = clientData?.fullAccessForChildren === true;
          
          // ✅ isChildClient is only true if they're a child AND don't have full access
          const isChildClient = isActuallyChild && !parentAllowsFullAccess;
          
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
            isActuallyChild: isActuallyChild,
            parentAllowsFullAccess: parentAllowsFullAccess,
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
      
      checkAuth: async () => {
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

        // ✅ Refresh from /me to get the latest fullAccessForChildren flag
        try {
          console.log('📦 Fetching fresh data from /me...');
          const meResponse = await api.get('/auth/me');
          const userData = meResponse.data.user;
          const clientData = meResponse.data.client;
          
          // Store fresh data in localStorage
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('client', JSON.stringify(clientData));
          
          // ✅ Detect child status with fullAccessForChildren flag
          const isActuallyChild = clientData?.parentClientId !== null && 
                                  clientData?.parentClientId !== undefined;
          const parentAllowsFullAccess = clientData?.fullAccessForChildren === true;
          const isChildClient = isActuallyChild && !parentAllowsFullAccess;
          
          localStorage.setItem('isChildClient', JSON.stringify(isChildClient));
          
          // Store agency client if this user is an agency
          let agencyClient = null;
          if (clientData?.isAgency) {
            agencyClient = { ...clientData };
            localStorage.setItem('agencyClient', JSON.stringify(agencyClient));
          } else {
            // Check if agencyClient exists in localStorage
            try {
              const agencyData = localStorage.getItem('agencyClient');
              if (agencyData) agencyClient = JSON.parse(agencyData);
            } catch (e) {
              agencyClient = null;
            }
          }
          
          // Restore active client if agency is viewing a child
          let activeClient = clientData;
          const savedActiveClientId = localStorage.getItem('activeClientId');
          const savedActiveClientName = localStorage.getItem('activeClientName');
          
          if (savedActiveClientId && agencyClient && savedActiveClientId !== agencyClient._id) {
            // Agency is viewing a child
            activeClient = {
              ...clientData,
              _id: savedActiveClientId,
              name: savedActiveClientName || 'Child Client',
              isAgency: false,
            };
            console.log('✅ Restored child client view:', activeClient.name);
          }
          
          set({
            user: userData,
            client: activeClient,
            agencyClient: agencyClient,
            token: token,
            isAuthenticated: true,
            isLoading: false,
            isChildClient: isChildClient,
          });
          
          console.log('✅ Auth check complete:', {
            clientName: activeClient?.name,
            isChildClient: isChildClient,
            parentAllowsFullAccess: parentAllowsFullAccess,
          });
          
          return true;
          
        } catch (error) {
          console.error('❌ Failed to fetch /me, falling back to localStorage:', error);
          
          // Fallback to localStorage
          const user = authService.getCurrentUser();
          
          let client = null;
          let agencyClient = null;
          let isChildClient = false;
          
          try {
            const clientData = localStorage.getItem('client');
            if (clientData) client = JSON.parse(clientData);
            const agencyData = localStorage.getItem('agencyClient');
            if (agencyData) agencyClient = JSON.parse(agencyData);
            const childData = localStorage.getItem('isChildClient');
            if (childData) isChildClient = JSON.parse(childData);
          } catch (e) {
            console.error('Error parsing client data:', e);
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
        }
      },
      
      refreshClient: async () => {
        try {
          console.log('🔄 Refreshing client data from /me...');
          const response = await api.get('/auth/me');
          if (response.data?.client) {
            const clientData = response.data.client;
            localStorage.setItem('client', JSON.stringify(clientData));
            
            // ✅ Recompute isChildClient with fullAccessForChildren flag
            const isActuallyChild = clientData?.parentClientId !== null && 
                                    clientData?.parentClientId !== undefined;
            const parentAllowsFullAccess = clientData?.fullAccessForChildren === true;
            const isChildClient = isActuallyChild && !parentAllowsFullAccess;
            
            localStorage.setItem('isChildClient', JSON.stringify(isChildClient));
            
            set({ 
              client: clientData,
              isChildClient: isChildClient,
            });
            
            console.log('✅ Client data refreshed:', {
              name: clientData.name,
              isChildClient: isChildClient,
            });
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