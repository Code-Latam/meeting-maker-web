import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth';

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
          
          // Try to get client from multiple sources
          let clientData = result.client;
          if (!clientData && result.user?.client) {
            clientData = result.user.client;
            console.log('📦 Client found in user.client:', clientData);
          }
          
          set({
            user: result.user,
            client: clientData,
            token: localStorage.getItem('jwt'),
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Verify what was set
          const state = get();
          console.log('📦 Auth state after login:', {
            user: state.user,
            client: state.client,
            clientName: state.client?.name,
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
        set({ 
          user: null, 
          client: null,
          token: null, 
          isAuthenticated: false 
        });
      },
      
      checkAuth: () => {
        console.log('🔍 Checking auth...');
        const token = localStorage.getItem('jwt');
        const user = authService.getCurrentUser();
        
        // Get client from localStorage directly
        let client = null;
        try {
          const clientData = localStorage.getItem('client');
          console.log('📦 Client data from localStorage:', clientData);
          if (clientData) {
            client = JSON.parse(clientData);
            console.log('✅ Parsed client:', client);
            console.log('✅ Client name:', client?.name);
          } else {
            console.log('⚠️ No client data in localStorage');
            // Try to get client from user object
            if (user?.client) {
              console.log('📦 Found client in user object:', user.client);
              client = user.client;
              // Store it for future use
              localStorage.setItem('client', JSON.stringify(client));
              console.log('✅ Client stored in localStorage from user object');
            }
          }
        } catch (error) {
          console.error('❌ Error parsing client data:', error);
          client = null;
        }
        
        console.log('📊 Auth check results:', {
          hasToken: !!token,
          hasUser: !!user,
          hasClient: !!client,
          clientName: client?.name,
        });
        
        if (token && user) {
          set({ 
            user, 
            client,
            token, 
            isAuthenticated: true 
          });
          console.log('✅ Auth set: user and client stored');
        } else {
          set({ 
            user: null, 
            client: null,
            token: null, 
            isAuthenticated: false 
          });
          console.log('❌ Auth cleared');
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

// UI Store
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