import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore, useAuthStore } from '../../store';
import { api } from '../../services/api';

const tabs = [
  { id: 'agents', icon: '🤖', label: 'Agents', path: '/' },
  { id: 'activity', icon: '📋', label: 'Activity', path: '/activity' },
  { id: 'conversions', icon: '🎯', label: 'Conversions', path: '/conversions' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { id: 'boost', icon: '🚀', label: 'Boost', path: '/boost' },
  { id: 'ranking', icon: '📈', label: 'Ranking', path: '/ranking' },
  { id: 'crm', icon: '🏢', label: 'CRM', path: '/crm' },
  { id: 'about', icon: 'ℹ️', label: 'About', path: '/about' },
];

// ✅ Agency-only tab
const agencyTab = { id: 'agency', icon: '🏢', label: 'Agency', path: '/agency' };

export function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveTab } = useUIStore();
  const { user, client, agencyClient } = useAuthStore();
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
    const intervalId = setInterval(checkLinkedInStatus, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // ✅ Check if user is an agency
  const isAgency = agencyClient?.isAgency || false;

  // Combine tabs - add agency tab if user is an agency
  const allTabs = [...tabs];
  if (isAgency) {
    allTabs.push(agencyTab);
  }

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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-10">
      <div className="flex justify-around items-center py-1.5 max-w-md mx-auto">
        {allTabs.map((tab) => {
          const active = isActive(tab);
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex items-center justify-center p-2 min-w-[36px] transition-colors ${
                active ? 'text-primary-600' : 'text-gray-500'
              }`}
              title={tab.label}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
            </button>
          );
        })}
      </div>
      
      {/* ✅ LinkedIn Status only - small indicator at bottom-right */}
      <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
        <span className="text-[8px] text-gray-400">🔗</span>
        <span 
          className={`w-1.5 h-1.5 rounded-full ${statusColor} ${linkedinStatus.checking ? 'animate-pulse' : ''}`}
        />
      </div>
    </nav>
  );
}