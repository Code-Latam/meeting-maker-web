import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email, password) => {
        set({ isLoading: true });
        const result = await authService.login(email, password);
        if (result.success) {
          set({
            user: result.user,
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
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      checkAuth: () => {
        const token = localStorage.getItem('jwt');
        const user = authService.getCurrentUser();
        if (token && user) {
          set({ user, token, isAuthenticated: true });
        } else {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

// UI Store (for mobile/desktop state)
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

// Handle window resize for mobile detection
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    const isMobile = window.innerWidth < 1024;
    useUIStore.getState().setMobile(isMobile);
  });
}