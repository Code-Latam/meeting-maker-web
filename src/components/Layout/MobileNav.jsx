import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../../store';

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

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };

  const isActive = (tab) => {
    if (tab.id === 'agents' && location.pathname === '/') return true;
    return location.pathname === tab.path;
  };

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
    </nav>
  );
}