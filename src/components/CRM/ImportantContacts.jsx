import React, { useState, useEffect, useCallback } from 'react';
import { crmService } from '../../services/crm';
import { useUIStore } from '../../store';
import { LoadingSpinner } from '../Common/LoadingSpinner';

// Person types that are considered "important" (excludes 'prospect')
const IMPORTANT_TYPES = [
  'client', 'friend', 'partner', 'investor', 
  'competitor', 'expert', 'influencer', 'person_of_interest'
];

// Display names for types
const TYPE_LABELS = {
  client: 'Clients',
  friend: 'Friends',
  partner: 'Partners',
  investor: 'Investors',
  competitor: 'Competitors',
  expert: 'Experts',
  influencer: 'Influencers',
  person_of_interest: 'People of Interest'
};

const TYPE_COLORS = {
  client: '#2563eb',
  friend: '#059669',
  partner: '#d97706',
  investor: '#4f46e5',
  competitor: '#dc2626',
  expert: '#db2777',
  influencer: '#7c3aed',
  person_of_interest: '#d97706'
};

const DEALS_COLUMN_KEY = 'in_deals';

export function ImportantContacts() {
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [columns, setColumns] = useState({});

  // Load contacts
  const loadContacts = useCallback(async () => {
    setLoading(true);
    const result = await crmService.getImportantContacts();
    if (result.success) {
      setContacts(result.people || []);
      organizeColumns(result.people || []);
    } else {
      showToast(result.error || 'Failed to load contacts', 'error');
    }
    setLoading(false);
  }, [showToast]);

  // Organize contacts by column
  const organizeColumns = (contactsData) => {
    const newColumns = {};
    
    // Initialize all type columns
    for (const type of IMPORTANT_TYPES) {
      newColumns[type] = [];
    }
    newColumns[DEALS_COLUMN_KEY] = [];
    
    // Process each contact
    for (const contact of contactsData) {
      const type = contact.personType || 'prospect';
      const deals = contact.deals || [];
      const hasDeals = deals && deals.length > 0;
      
      // Add to type column if it's an important type
      if (newColumns[type]) {
        newColumns[type].push(contact);
      }
      
      // Add to "In Deals" column if has deals
      if (hasDeals) {
        newColumns[DEALS_COLUMN_KEY].push(contact);
      }
    }
    
    setColumns(newColumns);
  };

  // Update person type
  const handleUpdateType = async (personId, newType) => {
    const result = await crmService.updatePersonType(personId, newType);
    if (result.success) {
      showToast(`Updated contact to ${TYPE_LABELS[newType] || newType}`, 'success');
      await loadContacts();
    } else {
      showToast(result.error || 'Failed to update contact type', 'error');
    }
  };

  // Handle drag and drop
  const handleDragStart = (e, personId, fromColumn, personType) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      personId,
      fromColumn,
      personType
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, isDealsColumn) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const dragData = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
    const fromDealsColumn = dragData.fromColumn === DEALS_COLUMN_KEY;
    
    // Prevent drag to/from deals column
    if (fromDealsColumn || isDealsColumn) {
      e.dataTransfer.dropEffect = 'none';
      e.currentTarget.classList.add('no-drop');
      return;
    }
    
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
    e.currentTarget.classList.remove('no-drop');
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    e.currentTarget.classList.remove('no-drop');
    
    const dragData = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
    const fromDealsColumn = dragData.fromColumn === DEALS_COLUMN_KEY;
    const toDealsColumn = targetColumn === DEALS_COLUMN_KEY;
    
    // Prevent drag to/from deals column
    if (fromDealsColumn || toDealsColumn) {
      showToast('Cannot move contacts to/from the Deals Stage column', 'error');
      return;
    }
    
    const personId = dragData.personId;
    const targetType = targetColumn;
    
    if (targetType !== dragData.personType) {
      await handleUpdateType(personId, targetType);
    }
  };

  // Refresh
  const handleRefresh = () => {
    loadContacts();
  };

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Get LinkedIn URL
  const getLinkedInUrl = (person) => {
    if (!person) return '';
    
    if (person.channels) {
      const liChannel = person.channels.find(c => c.type === 'linkedin');
      if (liChannel?.identifiers?.profileUrl) {
        return liChannel.identifiers.profileUrl;
      }
    }
    
    if (person.profiles?.linkedin?.url) {
      return person.profiles.linkedin.url;
    }
    
    return '';
  };

  // Get display name
  const getDisplayName = (person) => {
    if (!person) return 'Unknown';
    if (person.fullName) return person.fullName;
    const first = person.firstName || '';
    const last = person.lastName || '';
    return `${first} ${last}`.trim() || 'Unknown';
  };

  // Render contact card
  const renderContactCard = (contact, columnKey, isDealsColumn) => {
    const type = contact.personType || 'prospect';
    const name = getDisplayName(contact);
    const title = contact.title || '';
    const company = contact.companyName || '';
    const linkedinUrl = getLinkedInUrl(contact);
    const deals = contact.deals || [];
    const typeLabel = TYPE_LABELS[type] || type;
    const typeBadgeClass = `type-${type}`;

    return (
      <div
        key={contact._id}
        className={`bg-white rounded-lg border border-gray-200 p-3 mb-2 shadow-sm transition-all hover:shadow-md ${
          !isDealsColumn ? 'cursor-grab active:cursor-grabbing' : 'cursor-default opacity-75'
        }`}
        draggable={!isDealsColumn}
        onDragStart={(e) => handleDragStart(e, contact._id, columnKey, type)}
      >
        <div className="font-semibold text-sm text-gray-800">{name}</div>
        {title && <div className="text-xs text-gray-500">{title}</div>}
        {company && <div className="text-xs text-gray-400">🏢 {company}</div>}
        {linkedinUrl && (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.open(linkedinUrl, '_blank');
            }}
            className="text-xs text-blue-600 hover:underline block mt-1"
          >
            🔗 LinkedIn Profile
          </a>
        )}
        {deals.length > 0 && (
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 mt-1">
            {deals.length} deal{deals.length > 1 ? 's' : ''}
          </span>
        )}
        <div className="mt-1">
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${typeBadgeClass}`}>
            {typeLabel}
          </span>
        </div>
        {!isDealsColumn && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <select
              value={type}
              onChange={(e) => handleUpdateType(contact._id, e.target.value)}
              className="w-full text-xs px-2 py-1 rounded border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              {IMPORTANT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
              <option value="prospect">Move to Prospect</option>
            </select>
          </div>
        )}
        {isDealsColumn && (
          <div className="mt-2 pt-2 border-t border-gray-100 text-center text-xs text-gray-400">
            📊 In deal pipeline
          </div>
        )}
      </div>
    );
  };

  // Render a column
  const renderColumn = (columnKey, label, color, columnContacts, isDealsColumn = false) => {
    const isDeals = columnKey === DEALS_COLUMN_KEY;
    const contactsList = columnContacts || [];

    return (
      <div
        key={columnKey}
        className={`flex-shrink-0 w-64 sm:w-72 bg-gray-50 rounded-xl flex flex-col max-h-[70vh] ${
          isDeals ? 'border-l-4 border-green-500' : ''
        }`}
      >
        {/* Column Header */}
        <div
          className="bg-white rounded-t-xl px-4 py-3 border-b-3 sticky top-0 z-10 flex justify-between items-center"
          style={{ borderBottomColor: color }}
        >
          <div>
            <h3 className="text-sm font-semibold" style={{ color }}>
              {isDeals ? '📊 In Deals Stage' : label}
            </h3>
          </div>
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
            {contactsList.length}
          </span>
        </div>

        {/* Column Body */}
        <div
          className={`flex-1 p-3 overflow-y-auto min-h-[200px] transition-colors ${
            isDeals ? 'cursor-not-allowed' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, isDeals)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, columnKey)}
        >
          {contactsList.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">
              {isDeals ? 'No contacts with deals' : `No ${label.toLowerCase()} yet`}
            </div>
          ) : (
            contactsList.map((contact) => renderContactCard(contact, columnKey, isDeals))
          )}
        </div>
      </div>
    );
  };

  // Get total count
  const totalContacts = contacts.length;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">⭐ Important Contacts</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalContacts} contacts across {IMPORTANT_TYPES.length} categories
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn-secondary text-sm px-4 py-2"
        >
          🔄 Refresh
        </button>
      </div>

      {/* No Contacts */}
      {totalContacts === 0 && !loading && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500">No important contacts found</p>
          <p className="text-sm text-gray-400 mt-2">
            Contacts with types: {IMPORTANT_TYPES.map(t => TYPE_LABELS[t]).join(', ')}
          </p>
        </div>
      )}

      {/* Kanban Board */}
      {totalContacts > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {IMPORTANT_TYPES.map((type) =>
            renderColumn(type, TYPE_LABELS[type], TYPE_COLORS[type], columns[type] || [])
          )}
          {renderColumn(
            DEALS_COLUMN_KEY,
            'In Deals Stage',
            '#059669',
            columns[DEALS_COLUMN_KEY] || [],
            true
          )}
        </div>
      )}

      {/* Drag & Drop Styles */}
      <style>{`
        .border-b-3 {
          border-bottom-width: 3px;
        }
        .drag-over {
          background-color: #f3f4f6 !important;
        }
        .no-drop {
          background-color: #fef2f2 !important;
          cursor: not-allowed !important;
        }
        .type-client { background: #dbeafe; color: #1e40af; }
        .type-friend { background: #d1fae5; color: #065f46; }
        .type-partner { background: #fef3c7; color: #92400e; }
        .type-investor { background: #e0e7ff; color: #3730a3; }
        .type-competitor { background: #fee2e2; color: #991b1b; }
        .type-expert { background: #fce7f3; color: #9d174d; }
        .type-influencer { background: #ede9fe; color: #5b21b6; }
        .type-person_of_interest { background: #fef3c7; color: #92400e; }
      `}</style>
    </div>
  );
}