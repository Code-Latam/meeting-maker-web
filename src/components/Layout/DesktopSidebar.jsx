import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../store';
import { filterNavItems } from './navItems';
import { LogOut } from 'lucide-react';

export function DesktopSidebar() {
  const { user, client, agencyClient, isChildClient, logout } = useAuthStore();
  const { isSidebarOpen } = useUIStore();

  const displayName =
    client?.name ||
    client?.client?.name ||
    user?.client?.name ||
    user?.email ||
    'User';
  const isAgency = agencyClient?.isAgency || false;

  if (!isSidebarOpen) return null;

  const items = filterNavItems({ isChildClient, isAgency });
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="px-5 py-4 border-b border-gray-200">
        <p className="text-sm font-semibold text-gray-900 truncate" title={displayName}>
          {displayName}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          {isAgency ? 'Agency' : isChildClient ? 'Client' : 'Account'}
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  strokeWidth={1.75}
                  className={isActive ? 'text-primary-600' : 'text-gray-400'}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold grid place-items-center flex-shrink-0">
            {initials}
          </span>
          <span className="text-sm text-gray-700 truncate flex-1" title={displayName}>
            {displayName}
          </span>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
