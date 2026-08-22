// src/components/Layout/MobileNav.jsx

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
];

// ✅ Add blog tab
const blogTab = { id: 'blog', icon: '📝', label: 'Blog', path: '/blog' };

const agencyTab = { id: 'agency', icon: '🏢', label: 'Agency', path: '/agency' };

export function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveTab } = useUIStore();
  const { user, client, agencyClient, isChildClient } = useAuthStore();
  const [displayName, setDisplayName] = useState('User');
  const [linkedinStatus, setLinkedinStatus] = useState({
    connected: false,
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

  const isAgency = agencyClient?.isAgency || false;

  // ✅ Build tabs based on isChildClient from store
  let allTabs = [];

  if (isChildClient) {
    // ✅ Child client - remove agents, ranking, about, blog
    allTabs = tabs.filter(item => 
      item.id !== 'agents' && 
      item.id !== 'ranking' && 
      item.id !== 'about'
    );
    // ✅ Child clients can still see blog
    allTabs.push(blogTab);
  } else {
    // ✅ Regular user or agency - show all
    allTabs = [...tabs];
    allTabs.push({ id: 'about', icon: 'ℹ️', label: 'About', path: '/about' });
    // ✅ Add blog tab
    allTabs.push(blogTab);
  }

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
              className={`flex flex-col items-center p-1 min-w-[36px] transition-colors ${
                active ? 'text-primary-600' : 'text-gray-500'
              }`}
              title={tab.label}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              {active && (
                <span className="text-[8px] mt-0.5 font-medium">
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Client name and LinkedIn Status */}
      <div className="absolute right-2 bottom-1.5 flex items-center gap-1.5 bg-white/90 px-1.5 py-0.5 rounded">
        <span className="text-[8px] text-gray-400 truncate max-w-[40px]" title={displayName}>
          {displayName}
        </span>
        <span className="text-[8px] text-gray-400">🔗</span>
        <span 
          className={`w-1.5 h-1.5 rounded-full ${statusColor} ${linkedinStatus.checking ? 'animate-pulse' : ''}`}
        />
      </div>
    </nav>
  );
}