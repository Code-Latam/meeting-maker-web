import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../store';
import { api } from '../../services/api';

const navItems = [
  { id: 'agents', icon: '🤖', label: 'Agents', path: '/' },
  { id: 'activity', icon: '📋', label: 'Activity', path: '/activity' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { id: 'boost', icon: '🚀', label: 'Boost', path: '/boost' },
  { id: 'ranking', icon: '📈', label: 'Ranking', path: '/ranking' },
  { id: 'crm', icon: '🏢', label: 'CRM', path: '/crm' },
  { id: 'about', icon: 'ℹ️', label: 'About', path: '/about' },
];

export function DesktopSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();
  const { isSidebarOpen } = useUIStore();
  const [linkedinStatus, setLinkedinStatus] = useState({
    connected: false,
    status: 'checking',
    checking: true
  });

  // Check LinkedIn status on mount and periodically
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

    // Check immediately
    checkLinkedInStatus();

    // Check every 60 seconds
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

  // Get LinkedIn status display
  const getLinkedInStatusDisplay = () => {
    if (linkedinStatus.checking) {
      return { label: 'Checking...', color: 'bg-gray-400', pulse: true };
    }
    if (linkedinStatus.connected) {
      return { label: 'Connected', color: 'bg-green-500', pulse: false };
    }
    return { label: 'Disconnected', color: 'bg-red-500', pulse: false };
  };

  const statusDisplay = getLinkedInStatusDisplay();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">Meeting Maker</h1>
      </div>
      
      {/* LinkedIn Status */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">🔗 LinkedIn</span>
          <div className="flex items-center gap-2">
            <span 
              className={`w-2 h-2 rounded-full ${statusDisplay.color} ${statusDisplay.pulse ? 'animate-pulse' : ''}`}
            />
            <span className="text-xs text-gray-600">{statusDisplay.label}</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
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
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <span className="text-xl">👤</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}