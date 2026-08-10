import React, { useState } from 'react';
import { ImportantContacts } from '../CRM/ImportantContacts';
import DealsBoard  from '../CRM/DealsBoard';
import { FinanceDashboard } from '../Finance/FinanceDashboard';

export function CRMTab() {
  const [activeSubTab, setActiveSubTab] = useState('contacts');

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveSubTab('contacts')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeSubTab === 'contacts'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⭐ Important Contacts
          </button>
          <button
            onClick={() => setActiveSubTab('deals')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeSubTab === 'deals'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Deals Board
          </button>
          <button
            onClick={() => setActiveSubTab('finance')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeSubTab === 'finance'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            💰 Finance
          </button>
        </div>
      </div>

      {/* Content */}
      {activeSubTab === 'contacts' && <ImportantContacts />}
      {activeSubTab === 'deals' && <DealsBoard />}
      {activeSubTab === 'finance' && <FinanceDashboard />}
    </div>
  );
}