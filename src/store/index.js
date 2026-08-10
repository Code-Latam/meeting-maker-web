import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      client: null, // ✅ ADD client to store
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email, password) => {
        set({ isLoading: true });
        const result = await authService.login(email, password);
        if (result.success) {
          set({
            user: result.user,
            client: result.client, // ✅ Store client data
            token: localStorage.getItem('jwt'),
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
        return result;
      },
      
      logout: () => {
        authService.logout();
        set({ 
          user: null, 
          client: null, // ✅ Clear client on logout
          token: null, 
          isAuthenticated: false 
        });
      },
      
      checkAuth: () => {
        const token = localStorage.getItem('jwt');
        const user = authService.getCurrentUser();
        const client = authService.getCurrentClient(); // ✅ Get client from storage
        if (token && user) {
          set({ 
            user, 
            client, // ✅ Set client
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
      },
      
      // ✅ Method to set client data
      setClient: (client) => set({ client }),
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