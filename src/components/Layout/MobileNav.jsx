import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { filterNavItems } from './navItems';

export function MobileNav() {
  const { agencyClient, isChildClient } = useAuthStore();
  const isAgency = agencyClient?.isAgency || false;
  const items = filterNavItems({ isChildClient, isAgency });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur border-t border-gray-200 safe-bottom">
      <div className="flex items-stretch overflow-x-auto max-w-md mx-auto py-1 px-1">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex-shrink-0 flex flex-col items-center justify-center gap-0.5 min-w-[56px] px-1 py-1.5 rounded-xl transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <item.icon size={22} strokeWidth={1.75} />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
