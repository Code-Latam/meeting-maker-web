import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore, useAppStore } from '../../store';
import { api, setActiveClient, clearActiveClient } from '../../services/api';
import { Building2, ChevronDown, Check, Folder } from 'lucide-react';

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
        ...children.map((c) => ({
          _id: c._id,
          name: c.name || c.email,
          email: c.email,
          plan: c.plan,
          status: c.status,
          isAgency: false,
          isParent: false,
        })),
      ];

      setAccessibleClients(allClients);
    } catch {
      // keep previous list on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAgency && agencyClient) {
      fetchClients();
    }
  }, [isAgency, agencyClient]);

  useEffect(() => {
    if (activeClientId === null && accessibleClients.length > 0 && !isLoading) {
      const agencyClientOption = accessibleClients.find((c) => c.isParent);
      if (agencyClientOption) {
        setActiveClientId(agencyClientOption._id);
        setActiveClient(agencyClientOption._id);
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

  const currentClient = accessibleClients.find((c) => c._id === activeClientId);

  const handleClientSwitch = (clientId) => {
    const selectedClient = accessibleClients.find((c) => c._id === clientId);

    if (selectedClient?.isParent) {
      setActiveClientId(null);
      clearActiveClient();
      localStorage.setItem('activeClientId', selectedClient._id);
      localStorage.setItem('activeClientName', selectedClient.name);
      useAuthStore.setState({
        client: {
          ...useAuthStore.getState().client,
          _id: selectedClient._id,
          name: selectedClient.name,
          email: selectedClient.email,
          isAgency: true,
        },
      });
    } else {
      setActiveClientId(clientId);
      setActiveClient(clientId);
      localStorage.setItem('activeClientId', clientId);
      localStorage.setItem('activeClientName', selectedClient?.name || '');
      useAuthStore.setState({
        client: {
          ...useAuthStore.getState().client,
          _id: selectedClient._id,
          name: selectedClient.name,
          email: selectedClient.email,
          isAgency: false,
        },
      });
    }

    setIsOpen(false);
    window.location.href = '/';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <Building2 size={16} className="text-gray-400" />
        <span className="font-medium text-gray-700 truncate max-w-[140px]">
          {currentClient?.name || currentClient?.email || 'Select Client'}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[220px] z-50 max-h-[300px] overflow-y-auto p-1">
          {accessibleClients.map((c) => {
            const isActive = c._id === activeClientId;
            return (
              <button
                key={c._id}
                onClick={() => handleClientSwitch(c._id)}
                title={c.email || ''}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between gap-2 ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-400 flex-shrink-0">
                    {c.isParent ? <Building2 size={16} /> : <Folder size={16} />}
                  </span>
                  <span className="truncate">{c.name || c.email}</span>
                </span>
                {isActive && (
                  <Check size={16} className="text-primary-600 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
