import React from 'react';

export function ChannelTabs({ activeChannel, onChannelChange }) {
  const channels = [
    { id: 'linkedin', label: '🔗 LinkedIn Funnel' },
    { id: 'email', label: '📧 Email Funnel' }
  ];

  return (
    <div className="flex gap-2 mb-4 border-b border-gray-200 pb-3 overflow-x-auto">
      {channels.map((channel) => (
        <button
          key={channel.id}
          onClick={() => onChannelChange(channel.id)}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
            activeChannel === channel.id
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          {channel.label}
        </button>
      ))}
    </div>
  );
}