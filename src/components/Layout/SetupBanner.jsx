import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSetupStore } from '../../store/setupStore';
import { useUIStore } from '../../store';
import { TriangleAlert, CircleAlert, CircleCheck, ChevronDown, ChevronUp } from 'lucide-react';

export function SetupBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, loaded, error, fetchStatus } = useSetupStore();
  const { openUserMenu } = useUIStore();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  // Re-check after navigating (e.g. after the user fixes something)
  useEffect(() => {
    fetchStatus();
  }, [location.pathname, location.search]);

  // Poll every 30s
  useEffect(() => {
    const id = setInterval(fetchStatus, 30000);
    return () => clearInterval(id);
  }, []);

  // Don't render anything until the first check has actually completed
  // (avoids a premature "Setup complete" flash before data loads).
  if (!loaded) return null;

  // On error, stay silent rather than claiming completeness falsely.
  if (error) return null;

  // Everything is configured → subtle positive confirmation.
  if (!items || items.length === 0) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
        <CircleCheck size={14} className="flex-shrink-0 text-green-600" />
        <span className="text-xs font-medium text-green-800">Setup complete</span>
      </div>
    );
  }

  const criticals = items.filter((i) => i.severity === 'critical');
  const warnings = items.filter((i) => i.severity === 'warning');
  const hasCritical = criticals.length > 0;

  const summaryLabel = (() => {
    if (!hasCritical) {
      return `${warnings.length} setup suggestion${warnings.length > 1 ? 's' : ''}`;
    }
    const criticalPart = `${criticals.length} critical${criticals.length > 1 ? 's' : ''}`;
    const warningPart =
      warnings.length > 0
        ? ` · ${warnings.length} warning${warnings.length > 1 ? 's' : ''}`
        : '';
    return `${criticalPart}${warningPart} to complete`;
  })();

  const handleItemClick = (item) => {
    if (item.action === 'open_user_menu') {
      openUserMenu();
      return;
    }
    if (typeof item.action === 'string' && item.action.startsWith('/')) {
      navigate(item.action);
    }
  };

  return (
    <div
      className={`mb-4 rounded-xl border p-3 ${
        hasCritical ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'
      }`}
    >
      {/* Summary row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 min-w-0">
          {hasCritical ? (
            <TriangleAlert size={18} className="text-red-600 flex-shrink-0" />
          ) : (
            <CircleAlert size={18} className="text-amber-600 flex-shrink-0" />
          )}
          <span className={`text-sm font-medium ${hasCritical ? 'text-red-800' : 'text-amber-800'}`}>
            {summaryLabel}
          </span>
        </span>
        {expanded ? (
          <ChevronUp size={16} className="text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
        )}
      </button>

      {/* Item list */}
      {expanded && (
        <div className="mt-3 space-y-2">
          {criticals.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="w-full text-left bg-white border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <TriangleAlert size={14} className="text-red-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800">{item.title}</span>
              </div>
              {item.description && (
                <div className="text-xs text-gray-500 mt-0.5 ml-6">{item.description}</div>
              )}
            </button>
          ))}

          {warnings.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="w-full text-left bg-white border border-amber-200 rounded-lg px-3 py-2 hover:bg-amber-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CircleAlert size={14} className="text-amber-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">{item.title}</span>
              </div>
              {item.description && (
                <div className="text-xs text-gray-400 mt-0.5 ml-6">{item.description}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
