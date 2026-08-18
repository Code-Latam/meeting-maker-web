import React, { useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '../../store';

export function Header() {
  const { user, client, logout } = useAuthStore();
  const { isMobile, toggleSidebar } = useUIStore();
  const [displayName, setDisplayName] = useState('User');

  // Update display name when client or user changes
  useEffect(() => {
    console.log('🔄 Header useEffect - client changed:', client);
    console.log('🔄 Header useEffect - client?.name:', client?.name);
    
    // Get client name from multiple possible locations
    const getClientName = () => {
      if (client?.name) return client.name;
      if (client?.client?.name) return client.client.name;
      if (user?.client?.name) return user.client.name;
      return null;
    };

    const clientName = getClientName();
    const newDisplayName = clientName || user?.email || 'User';
    console.log('📝 Setting display name to:', newDisplayName);
    setDisplayName(newDisplayName);
  }, [client, user]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Header Debug:');
    console.log('  user:', user);
    console.log('  client:', client);
    console.log('  client?.name:', client?.name);
    console.log('  client?.isAgency:', client?.isAgency);
    console.log('  displayName state:', displayName);
  }, [user, client, displayName]);

  // ✅ Check if user is an agency
  const isAgency = client?.isAgency || false;

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 safe-top">
      <div className="flex items-center justify-between px-4 h-14 lg:h-16">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
          )}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-primary-600 whitespace-nowrap flex-shrink-0">
              Meeting Maker
            </h1>
            <span className="text-sm text-gray-400 font-medium flex-shrink-0">|</span>
            <span className="text-sm text-gray-600 font-medium truncate">
              {displayName}
            </span>
            {/* ✅ Show agency badge if user is an agency */}
            {isAgency && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700 flex-shrink-0">
                🏢 Agency
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
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