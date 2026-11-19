import React, { useState } from 'react';
import { ActivityTab } from '../components/Activity/ActivityTab';
import { ConversionsTab } from '../components/Tabs/ConversionsTab';

export function ActivityPage() {
  const [tab, setTab] = useState('activity');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          <button
            onClick={() => setTab('activity')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'activity'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Activity
          </button>
          <button
            onClick={() => setTab('conversions')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'conversions'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Conversions
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === 'activity' ? <ActivityTab /> : <ConversionsTab />}
    </div>
  );
}
