import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../../store';
import { api } from '../../services/api';

const tabs = [
  { id: 'agents', icon: '🤖', label: 'Agents', path: '/' },
  { id: 'activity', icon: '📋', label: 'Activity', path: '/activity' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { id: 'boost', icon: '🚀', label: 'Boost', path: '/boost' },
  { id: 'ranking', icon: '📈', label: 'Ranking', path: '/ranking' },
  { id: 'crm', icon: '🏢', label: 'CRM', path: '/crm' },
  { id: 'about', icon: 'ℹ️', label: 'About', path: '/about' },
];

export function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveTab } = useUIStore();
  const [linkedinStatus, setLinkedinStatus] = useState({
    connected: false,
    checking: true
  });

  // Check LinkedIn status
  useEffect(() => {
    const checkLinkedInStatus = async () => {
      try {
        const response = await api.get('/api/activity/linkedin-status');
        if (response.data) {
          setLinkedinStatus({
            connected: response.data.connected || false,
            checking: false
          });
        }
      } catch (error) {
        console.error('Failed to check LinkedIn status:', error);
        setLinkedinStatus({
          connected: false,
          checking: false
        });
      }
    };

    checkLinkedInStatus();

    // Check every 60 seconds
    const intervalId = setInterval(checkLinkedInStatus, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };

  const isActive = (tab) => {
    if (tab.id === 'agents' && location.pathname === '/') return true;
    return location.pathname === tab.path;
  };

  const statusColor = linkedinStatus.checking ? 'bg-gray-400' : 
                      linkedinStatus.connected ? 'bg-green-500' : 'bg-red-500';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom max-w-md mx-auto z-10">
      <div className="flex justify-around py-1">
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex flex-col items-center p-2 min-w-[44px] transition-colors ${
                active ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className={`text-xs mt-0.5 ${active ? 'font-medium' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* LinkedIn Status Dot on Mobile */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        <span className="text-[10px] text-gray-400">🔗</span>
        <span 
          className={`w-2 h-2 rounded-full ${statusColor} ${linkedinStatus.checking ? 'animate-pulse' : ''}`}
        />
      </div>
    </nav>
  );
}