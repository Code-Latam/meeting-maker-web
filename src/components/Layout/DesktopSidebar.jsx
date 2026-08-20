import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../store';
import { api } from '../../services/api';

const navItems = [
  { id: 'agents', icon: '🤖', label: 'Agents', path: '/' },
  { id: 'activity', icon: '📋', label: 'Activity', path: '/activity' },
  { id: 'conversions', icon: '🎯', label: 'Conversions', path: '/conversions' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { id: 'boost', icon: '🚀', label: 'Boost', path: '/boost' },
  { id: 'ranking', icon: '📈', label: 'Ranking', path: '/ranking' },
  { id: 'crm', icon: '🏢', label: 'CRM', path: '/crm' },
  { id: 'about', icon: 'ℹ️', label: 'About', path: '/about' },
];

// ✅ Agency-only nav items
const agencyNavItems = [
  { id: 'agency', icon: '🏢', label: 'Agency', path: '/agency' },
];

export function DesktopSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, client, agencyClient } = useAuthStore();
  const { isSidebarOpen } = useUIStore();
  const [displayName, setDisplayName] = useState('Loading...');
  const [linkedinStatus, setLinkedinStatus] = useState({
    connected: false,
    status: 'checking',
    checking: true
  });

  // Update display name when client or user changes
  useEffect(() => {
    const getClientName = () => {
      if (client?.name) return client.name;
      if (client?.client?.name) return client.client.name;
      if (user?.client?.name) return user.client.name;
      return null;
    };

    const clientName = getClientName();
    const newDisplayName = clientName || user?.email || 'User';
    setDisplayName(newDisplayName);
  }, [client, user]);

  // Check LinkedIn status
  useEffect(() => {
    let intervalId = null;
    
    const checkLinkedInStatus = async () => {
      try {
        const response = await api.get('/api/activity/linkedin-status');
        if (response.data) {
          setLinkedinStatus({
            connected: response.data.connected || false,
            status: response.data.status || 'unknown',
            checking: false
          });
        }
      } catch (error) {
        console.error('Failed to check LinkedIn status:', error);
        setLinkedinStatus({
          connected: false,
          status: 'error',
          checking: false
        });
      }
    };

    checkLinkedInStatus();
    intervalId = setInterval(checkLinkedInStatus, 60000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  if (!isSidebarOpen) return null;

  const isActive = (item) => {
    if (item.id === 'agents' && location.pathname === '/') return true;
    return location.pathname === item.path;
  };

  const getLinkedInStatusDisplay = () => {
    if (linkedinStatus.checking) {
      return { label: 'Checking...', color: 'bg-gray-400', pulse: true };
    }
    if (linkedinStatus.connected) {
      return { label: 'Connected ✅', color: 'bg-green-500', pulse: false };
    }
    if (linkedinStatus.status === 'invalid_session') {
      return { label: 'Session Invalid', color: 'bg-yellow-500', pulse: false };
    }
    return { label: 'Disconnected', color: 'bg-red-500', pulse: false };
  };

  const statusDisplay = getLinkedInStatusDisplay();

  // ✅ Check if user is an agency
  const isAgency = agencyClient?.isAgency || false;
  // Combine nav items - add agency items if user is an agency
  const allNavItems = [...navItems];
  if (isAgency) {
    allNavItems.push(...agencyNavItems);
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Client Name Only */}
      <div className="p-4 border-b border-gray-200">
        <p className="text-lg font-semibold text-gray-800 truncate" title={displayName}>
          {displayName}
        </p>
        {/* ✅ Show agency badge */}
        {isAgency && (
          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
              🏢 Agency
            </span>
          </div>
        )}
      </div>
      
      {/* LinkedIn Status */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">🔗 LinkedIn</span>
          <div className="flex items-center gap-2">
            <span 
              className={`w-2.5 h-2.5 rounded-full ${statusDisplay.color} ${statusDisplay.pulse ? 'animate-pulse' : ''}`}
            />
            <span className="text-xs text-gray-600">{statusDisplay.label}</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {allNavItems.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center mb-2 truncate" title={displayName}>
          {displayName}
        </p>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}