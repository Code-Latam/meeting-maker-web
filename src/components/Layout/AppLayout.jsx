import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../store';
import { MobileNav } from './MobileNav';
import { DesktopSidebar } from './DesktopSidebar';
import { Header } from './Header';
import { Toast } from '../Common/Toast';

export function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const { isMobile } = useUIStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile ? (
        // Mobile Layout
        <div className="flex flex-col h-screen max-w-md mx-auto">
          <Header />
          <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 scroll-container">
            <Outlet />
          </main>
          <MobileNav />
        </div>
      ) : (
        // Desktop Layout
        <div className="flex h-screen">
          <DesktopSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 scroll-container">
              <div className="max-w-7xl mx-auto">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      )}
      <Toast />
    </div>
  );
}