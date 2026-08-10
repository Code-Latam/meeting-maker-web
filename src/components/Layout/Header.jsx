import React, { useState, useEffect } from 'react';
import { useAuthStore, useUIStore } from '../../store';
import { api } from '../../services/api';

export function Header() {
  const { user, logout } = useAuthStore();
  const { isMobile, toggleSidebar } = useUIStore();
  const [clientName, setClientName] = useState('');

  // Fetch client name when user changes
  useEffect(() => {
    const fetchClientName = async () => {
      try {
        // Option 1: If user object has client name
        if (user?.client?.name) {
          setClientName(user.client.name);
          return;
        }
        
        // Option 2: Fetch from API
        const response = await api.get('/auth/me');
        if (response.data?.client?.name) {
          setClientName(response.data.client.name);
        }
      } catch (error) {
        console.error('Failed to fetch client name:', error);
      }
    };

    if (user) {
      fetchClientName();
    }
  }, [user]);

  // Get display name
  const displayName = clientName || user?.client?.name || user?.email || 'User';

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 safe-top">
      <div className="flex items-center justify-between px-4 h-14 lg:h-16">
        <div className="flex items-center gap-3">
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-xl font-bold text-primary-600">
              Meeting Maker
            </h1>
            <span className="hidden sm:inline text-sm text-gray-400 font-medium">|</span>
            <span className="hidden sm:inline text-sm text-gray-600 font-medium truncate max-w-[150px] lg:max-w-[200px]">
              {displayName}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Show client name on mobile */}
          <span className="sm:hidden text-xs text-gray-500 truncate max-w-[80px]">
            {displayName}
          </span>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Logout"
          >
            👤
          </button>
        </div>
      </div>
    </header>
  );
}