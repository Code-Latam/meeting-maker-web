import axios from 'axios';
import { useAppStore } from '../store';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.meetingmaker.tech';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add token and client ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add active client ID to headers for agency mode
    const activeClientId = useAppStore.getState().activeClientId;
    if (activeClientId) {
      config.headers['X-Client-Id'] = activeClientId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor with special handling for verify-child
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ Check if this is a verify-child request
    const isVerifyChildRequest = error.config?.url?.includes('/auth/agency/verify-child');
    
    // Only handle 401 for non-verify-child requests
    if (error.response?.status === 401 && !isVerifyChildRequest) {
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
      localStorage.removeItem('client');
      window.location.href = '/login';
    }
    
    // ✅ For verify-child, just pass the error through
    return Promise.reject(error);
  }
);

// Helper to set the active client (for agency switching)
export const setActiveClient = (clientId) => {
  useAppStore.getState().setActiveClientId(clientId);
};

// Helper to clear the active client
export const clearActiveClient = () => {
  useAppStore.getState().clearActiveClient();
};

export { api, API_URL };