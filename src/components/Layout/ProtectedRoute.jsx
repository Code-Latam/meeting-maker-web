import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, checkAuth]);

  if (!isAuthenticated) {
    return null;
  }

  return children;
}