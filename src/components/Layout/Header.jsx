import React, { useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '../../store';
import { ClientSwitcher } from './ClientSwitcher';
import { useAppStore } from '../../store';

export function Header() {
  const { user, client, agencyClient, logout, isChildClient } = useAuthStore();
  const { activeClientId } = useAppStore();
  const { isMobile, toggleSidebar } = useUIStore();
  const [displayName, setDisplayName] = useState('User');
  const [isAgency, setIsAgency] = useState(false);
  const [isViewingChild, setIsViewingChild] = useState(false);
  const [childName, setChildName] = useState('');

  useEffect(() => {
    // Get display name from active client
    const getClientName = () => {
      if (client?.name) return client.name;
      if (client?.client?.name) return client.client.name;
      if (user?.client?.name) return user.client.name;
      return null;
    };

    const clientName = getClientName();
    setDisplayName(clientName || user?.email || 'User');
    
    // Check if user is an agency
    const isAgencyUser = agencyClient?.isAgency || false;
    setIsAgency(isAgencyUser);
    
    // Check if we're viewing a child client
    const isChild = isAgencyUser && 
                    activeClientId && 
                    agencyClient?._id && 
                    activeClientId !== agencyClient._id;
    setIsViewingChild(isChild);
    
    // Try to find the child name from accessible clients
    if (isChild && client?.name && client._id === activeClientId) {
      setChildName(client.name);
    } else if (isChild) {
      setChildName('Child Client');
    } else {
      setChildName('');
    }
    
    console.log('📝 Header - displayName:', displayName);
    console.log('📝 Header - isAgency:', isAgencyUser);
    console.log('📝 Header - isChildClient:', isChildClient);
    console.log('📝 Header - isViewingChild:', isChild);
  }, [client, user, agencyClient, activeClientId, isChildClient]);

  // Build display label - use child name if viewing child
  const getDisplayLabel = () => {
    if (isViewingChild && childName) {
      return childName;
    }
    return displayName;
  };

  const displayLabel = getDisplayLabel();

  // ✅ Hide Meeting Maker if user is agency OR child client
  const hideMeetingMaker = isAgency || isChildClient;

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
            {/* ✅ Hide "Meeting Maker" for agency users OR child clients */}
            {!hideMeetingMaker && (
              <>
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-primary-600 whitespace-nowrap flex-shrink-0">
                  Meeting Maker
                </h1>
                <span className="text-sm text-gray-400 font-medium flex-shrink-0">|</span>
              </>
            )}
            <span className={`text-sm font-medium truncate ${hideMeetingMaker ? 'text-gray-800' : 'text-gray-600'}`}>
              {displayLabel}
            </span>
            {/* Show agency badge */}
            {isAgency && !isViewingChild && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700 flex-shrink-0">
                🏢 Agency
              </span>
            )}
            {/* Show child badge when viewing a child */}
            {isViewingChild && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                📁 Child
              </span>
            )}
            {/* Show agency name when viewing child */}
            {isAgency && isViewingChild && agencyClient?.name && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0 text-[10px]">
                via {agencyClient.name}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAgency && <ClientSwitcher />}
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