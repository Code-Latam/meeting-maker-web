import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth';
import { api } from '../services/api';

// ============================================================
// AUTH STORE
// ============================================================
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      client: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email, password) => {
        console.log('🔐 Login started...');
        set({ isLoading: true });
        const result = await authService.login(email, password);
        console.log('🔐 Login result:', result);
        
        if (result.success) {
          console.log('✅ Login successful!');
          console.log('  user:', result.user);
          console.log('  client:', result.client);
          console.log('  client.name:', result.client?.name);
          
          let clientData = result.client;
          if (!clientData && result.user?.client) {
            clientData = result.user.client;
            console.log('📦 Client found in user.client:', clientData);
          }
          
          // Fetch full client data from /me to get agency fields
          try {
            console.log('📦 Fetching full client data from /me...');
            const meResponse = await api.get('/auth/me');
            if (meResponse.data?.client) {
              clientData = {
                ...clientData,
                ...meResponse.data.client,
              };
              console.log('✅ Full client data fetched:', clientData);
              console.log('✅ isAgency:', clientData.isAgency);
              console.log('✅ childClientIds:', clientData.childClientIds);
            }
          } catch (meError) {
            console.error('❌ Failed to fetch /me:', meError);
          }
          
          set({
            user: result.user,
            client: clientData,
            token: localStorage.getItem('jwt'),
            isAuthenticated: true,
            isLoading: false,
          });
          
          const state = get();
          console.log('📦 Auth state after login:', {
            user: state.user,
            client: state.client,
            clientName: state.client?.name,
            isAgency: state.client?.isAgency,
            childCount: state.client?.childClientIds?.length || 0,
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
        // ✅ Clear active client on logout
        if (typeof useAppStore !== 'undefined') {
          useAppStore.getState().clearActiveClient();
        }
        set({ 
          user: null, 
          client: null,
          token: null, 
          isAuthenticated: false 
        });
      },
      
     checkAuth: async () => {
  console.log('🔍 Checking auth...');
  const token = localStorage.getItem('jwt');
  
  if (!token) {
    set({ 
      user: null, 
      client: null,
      token: null, 
      isAuthenticated: false 
    });
    return;
  }

  try {
    // ✅ Fetch fresh user and client data from /me
    const response = await api.get('/auth/me');
    const userData = response.data.user;
    const clientData = response.data.client;
    
    console.log('✅ Fresh client data from /me:', clientData);
    console.log('✅ isAgency:', clientData?.isAgency);
    console.log('✅ childClientIds:', clientData?.childClientIds);
    
    // ✅ Store in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('client', JSON.stringify(clientData));
    
    set({
      user: userData,
      client: clientData,
      token: token,
      isAuthenticated: true,
      isLoading: false,
    });
    
    console.log('✅ Auth set with fresh data');
  } catch (error) {
    console.error('❌ Failed to fetch /me:', error);
    // Fallback: try to load from localStorage
    const user = authService.getCurrentUser();
    let client = null;
    try {
      const clientData = localStorage.getItem('client');
      if (clientData) {
        client = JSON.parse(clientData);
      }
    } catch (e) {
      client = null;
    }
    
    if (user) {
      set({ 
        user, 
        client,
        token, 
        isAuthenticated: true 
      });
    } else {
      set({ 
        user: null, 
        client: null,
        token: null, 
        isAuthenticated: false 
      });
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
            set({ client: clientData });
            console.log('✅ Client data refreshed:', clientData);
            console.log('✅ isAgency:', clientData.isAgency);
            console.log('✅ childClientIds:', clientData.childClientIds);
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
// ✅ APP STORE - For agency client switching
// ============================================================
export const useAppStore = create(
  persist(
    (set) => ({
      activeClientId: null,
      setActiveClientId: (clientId) => set({ activeClientId: clientId }),
      clearActiveClient: () => set({ activeClientId: null }),
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

// Handle window resize
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    const isMobile = window.innerWidth < 1024;
    useUIStore.getState().setMobile(isMobile);
  });
}