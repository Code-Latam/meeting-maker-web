import React, { useState } from 'react';
import { ImportantContacts } from '../CRM/ImportantContacts';
import DealsBoard from '../CRM/DealsBoard';
import { FinanceDashboard } from '../Finance/FinanceDashboard';
import { PersonSearch } from '../CRM/PersonSearch';
import { TasksTab } from '../CRM/TasksTab';

export function CRMTab() {
  const [activeSubTab, setActiveSubTab] = useState('contacts');

  return (
    <div className="space-y-4">
      {/* Person search */}
      <PersonSearch />

      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('contacts')}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'contacts'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⭐ Important Contacts
          </button>
          <button
            onClick={() => setActiveSubTab('deals')}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'deals'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Deals Board
          </button>
          <button
            onClick={() => setActiveSubTab('tasks')}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'tasks'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ✅ Tasks
          </button>
          <button
            onClick={() => setActiveSubTab('finance')}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
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
      {activeSubTab === 'tasks' && <TasksTab />}
      {activeSubTab === 'finance' && <FinanceDashboard />}
    </div>
  );
}
