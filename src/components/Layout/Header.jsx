import React, { useEffect, useState } from 'react';
import { useAuthStore, useUIStore, useAppStore } from '../../store';
import { ClientSwitcher } from './ClientSwitcher';
import { UserMenu } from './UserMenu';
import { Menu as MenuIcon, Bot } from 'lucide-react';

export function Header() {
  const { user, client, agencyClient, isChildClient } = useAuthStore();
  const { activeClientId } = useAppStore();
  const { isMobile, toggleSidebar } = useUIStore();
  const [displayName, setDisplayName] = useState('User');
  const [isAgency, setIsAgency] = useState(false);
  const [isViewingChild, setIsViewingChild] = useState(false);
  const [childName, setChildName] = useState('');

  useEffect(() => {
    const getClientName = () => {
      if (client?.name) return client.name;
      if (client?.client?.name) return client.client.name;
      if (user?.client?.name) return user.client.name;
      return null;
    };

    const clientName = getClientName();
    setDisplayName(clientName || user?.email || 'User');

    const isAgencyUser = agencyClient?.isAgency || false;
    setIsAgency(isAgencyUser);

    const isChild =
      isAgencyUser &&
      activeClientId &&
      agencyClient?._id &&
      activeClientId !== agencyClient._id;
    setIsViewingChild(isChild);

    if (isChild && client?.name && client._id === activeClientId) {
      setChildName(client.name);
    } else if (isChild) {
      setChildName('Child Client');
    } else {
      setChildName('');
    }
  }, [client, user, agencyClient, activeClientId, isChildClient]);

  const displayLabel = isViewingChild && childName ? childName : displayName;
  const hideMeetingMaker = isAgency || isChildClient;

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 safe-top">
      <div className="flex items-center justify-between px-4 h-14 lg:h-16">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <MenuIcon size={20} />
            </button>
          )}

          {!hideMeetingMaker && (
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className="w-8 h-8 rounded-lg bg-primary-600 text-white grid place-items-center">
                <Bot size={18} />
              </span>
              <span className="text-sm lg:text-base font-semibold text-gray-900 whitespace-nowrap">
                Meeting Maker
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-sm font-medium truncate ${
                hideMeetingMaker ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              {displayLabel}
            </span>

            {isAgency && !isViewingChild && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary-50 text-primary-700 flex-shrink-0">
                Agency
              </span>
            )}
            {isViewingChild && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary-50 text-primary-700 flex-shrink-0">
                Child
              </span>
            )}
            {isAgency && isViewingChild && agencyClient?.name && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0">
                via {agencyClient.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isAgency && <ClientSwitcher />}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
