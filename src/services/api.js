import axios from 'axios';
import { useAppStore } from '../store';
import { useAuthStore } from '../store';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.meetingmaker.tech';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 600000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // NEVER send X-Client-Id for /me endpoint
    if (config.url?.includes('/auth/me')) {
      return config;
    }

    const activeClientId = useAppStore.getState().activeClientId;
    const agencyClient = useAuthStore.getState().agencyClient;
    
    if (activeClientId && agencyClient && activeClientId !== agencyClient._id?.toString()) {
      config.headers['X-Client-Id'] = activeClientId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isVerifyChildRequest = url.includes('/auth/agency/verify-child');
    const isMeRequest = url.includes('/auth/me');
    const isLoginRequest = url.includes('/auth/login');
    
    // ✅ NEVER redirect on 401 for auth-related calls
    if (error.response?.status === 401 && !isVerifyChildRequest && !isMeRequest && !isLoginRequest) {
      console.log('🔒 401 Unauthorized - Redirecting to login');
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
      localStorage.removeItem('client');
      localStorage.removeItem('agencyClient');
      localStorage.removeItem('activeClientId');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const setActiveClient = (clientId) => {
  useAppStore.getState().setActiveClientId(clientId);
};

export const clearActiveClient = () => {
  useAppStore.getState().clearActiveClient();
};

export { api, API_URL };