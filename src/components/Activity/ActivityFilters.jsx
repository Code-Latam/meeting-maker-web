import React, { useState, useRef, useEffect } from 'react';

const TIME_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_3_days', label: '3 Days' },
  { value: 'last_7_days', label: '7 Days' },
  { value: 'last_30_days', label: '30 Days' }
];

const CHANNELS = [
  { value: 'all', label: 'All', icon: '📡' },
  { value: 'linkedin', label: 'LinkedIn', icon: '🔗' },
  { value: 'email', label: 'Email', icon: '📧' }
];

const DIRECTIONS = [
  { value: 'all', label: 'All' },
  { value: 'inbound', label: '⬇️ Inbound' },
  { value: 'outbound', label: '⬆️ Outbound' }
];

export function ActivityFilters({
  timeRange,
  channel,
  direction,
  searchQuery,
  onTimeRangeChange,
  onChannelChange,
  onDirectionChange,
  onSearchChange,
  counts = null,
  className = '',
  showDirection = true // ✅ NEW: Allow hiding direction filter
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const searchTimeout = useRef(null);

  // Update local search when prop changes
  useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setLocalSearch(value);

    // Debounce search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      onSearchChange(localSearch);
    }
  };

  const clearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400">🔍</span>
        </div>
        <input
          type="text"
          value={localSearch}
          onChange={handleSearchInput}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search by person name..."
          className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
        />
        {localSearch && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Time Range */}
      <div className="flex flex-wrap gap-1.5">
        {TIME_RANGES.map((range) => {
          const isActive = timeRange === range.value;
          const count = counts?.find(c => c.key === range.value)?.count || 0;
          return (
            <button
              key={range.value}
              onClick={() => onTimeRangeChange(range.value)}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-full transition-colors min-h-[36px] ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range.label}
              {count > 0 && (
                <span className={`ml-1 text-xs ${
                  isActive ? 'text-white/80' : 'text-gray-400'
                }`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Channel & Direction */}
      <div className="flex flex-wrap gap-2">
        {/* Channel */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {CHANNELS.map((ch) => {
            const isActive = channel === ch.value;
            return (
              <button
                key={ch.value}
                onClick={() => onChannelChange(ch.value)}
                className={`px-3 py-1 text-xs rounded-md transition-colors min-h-[32px] ${
                  isActive
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="sm:hidden">{ch.icon}</span>
                <span className="hidden sm:inline">{ch.icon} {ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* Direction - ✅ Conditionally shown */}
        {showDirection && (
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {DIRECTIONS.map((dir) => {
              const isActive = direction === dir.value;
              return (
                <button
                  key={dir.value}
                  onClick={() => onDirectionChange(dir.value)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors min-h-[32px] ${
                    isActive
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {dir.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}