import React from 'react';
import { useAuthStore, useUIStore } from '../../store';

export function Header() {
  const { user, logout } = useAuthStore();
  const { isMobile, toggleSidebar } = useUIStore();

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
          <h1 className="text-lg lg:text-xl font-bold text-primary-600">
            Meeting Maker
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden sm:inline">
            {user?.firstName || user?.email || 'User'}
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