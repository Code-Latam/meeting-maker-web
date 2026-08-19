import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore, useAppStore } from '../../store';
import { api, setActiveClient, clearActiveClient } from '../../services/api';

export function ClientSwitcher() {
  const { agencyClient } = useAuthStore();
  const { activeClientId, setActiveClientId } = useAppStore();
  const [accessibleClients, setAccessibleClients] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef(null);

  const isAgency = agencyClient?.isAgency || false;

  const fetchClients = async () => {
    if (!agencyClient) return;
    
    try {
      setIsLoading(true);
      const response = await api.get('/auth/agency/children');
      
      const children = response.data.children || [];
      
      const allClients = [
        {
          _id: agencyClient._id,
          name: agencyClient.name || agencyClient.email,
          email: agencyClient.email,
          isAgency: true,
          isParent: true,
        },
        ...children.map(c => ({
          _id: c._id,
          name: c.name || c.email,
          email: c.email,
          plan: c.plan,
          status: c.status,
          isAgency: false,
          isParent: false,
        }))
      ];
      
      setAccessibleClients(allClients);
    } catch (error) {
      console.error('❌ Failed to fetch clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAgency && agencyClient) {
      fetchClients();
    }
  }, [isAgency, agencyClient]);

  // Auto-select agency client if no active client is set
  useEffect(() => {
    if (activeClientId === null && accessibleClients.length > 0 && !isLoading) {
      const agencyClientOption = accessibleClients.find(c => c.isParent);
      if (agencyClientOption) {
        setActiveClientId(agencyClientOption._id);
        setActiveClient(agencyClientOption._id);
        // ✅ Save to localStorage
        localStorage.setItem('activeClientId', agencyClientOption._id);
        localStorage.setItem('activeClientName', agencyClientOption.name);
      }
    }
  }, [accessibleClients, activeClientId, setActiveClientId, isLoading]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAgency || isLoading || accessibleClients.length <= 1) {
    return null;
  }

  const currentClient = accessibleClients.find(c => c._id === activeClientId);

  const handleClientSwitch = (clientId) => {
    console.log('🔄 Switching to client:', clientId);
    
    const selectedClient = accessibleClients.find(c => c._id === clientId);
    
    if (selectedClient?.isParent) {
      // Switching to agency
      console.log('🔄 Switching to agency');
      setActiveClientId(null);
      clearActiveClient();
      // ✅ Save agency info
      localStorage.setItem('activeClientId', selectedClient._id);
      localStorage.setItem('activeClientName', selectedClient.name);
      // Update client in store
      useAuthStore.setState({ 
        client: {
          ...useAuthStore.getState().client,
          _id: selectedClient._id,
          name: selectedClient.name,
          email: selectedClient.email,
          isAgency: true,
        }
      });
    } else {
      // Switching to child client
      console.log('🔄 Switching to child:', selectedClient?.name);
      setActiveClientId(clientId);
      setActiveClient(clientId);
      // ✅ Save child info
      localStorage.setItem('activeClientId', clientId);
      localStorage.setItem('activeClientName', selectedClient?.name || '');
      // Update client in store
      useAuthStore.setState({ 
        client: {
          ...useAuthStore.getState().client,
          _id: selectedClient._id,
          name: selectedClient.name,
          email: selectedClient.email,
          isAgency: false,
        }
      });
    }
    
    setIsOpen(false);
    window.location.href = '/';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <span className="text-gray-500">🏢</span>
        <span className="font-medium text-gray-700 truncate max-w-[120px]">
          {currentClient?.name || currentClient?.email || 'Select Client'}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[220px] z-50 max-h-[300px] overflow-y-auto">
          <div className="p-1">
            {accessibleClients.map((c) => {
              const isActive = c._id === activeClientId;
              return (
                <button
                  key={c._id}
                  onClick={() => handleClientSwitch(c._id)}
                  className={`w-full text-left px-4 py-2.5 text-sm rounded-md transition-colors flex items-center justify-between ${
                    isActive 
                      ? 'bg-primary-50 text-primary-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{c.name || c.email}</span>
                    <span className="text-xs text-gray-400 truncate">
                      {c.isParent ? '🏢 Agency' : `📁 ${c.email || ''}`}
                    </span>
                  </div>
                  {isActive && (
                    <span className="text-primary-500 flex-shrink-0 ml-2">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}