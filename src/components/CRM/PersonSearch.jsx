import React, { useState, useRef } from 'react';
import { crmService } from '../../services/crm';
import { ActivityDetailModal } from '../Activity/ActivityDetailModal';
import { Search } from 'lucide-react';

export function PersonSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (q.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    timeoutRef.current = setTimeout(async () => {
      const result = await crmService.searchPeople(q);
      setIsSearching(false);
      setResults(result.success ? result.items || [] : []);
    }, 300);
  };

  const openPerson = (person) => {
    const activity = {
      personId: person._id,
      person: person,
      personName: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim(),
      personTitle: person.title || '',
      personCompany: person.companyName || '',
      personType: person.personType || 'prospect',
      assignedAgentId: person.assignedAgentId || null,
      groupId: person.groupId || null,
      group: person.group || null,
      channelPreference: person.channelPreference || 'linkedin',
      channel: 'linkedin',
    };
    setSelectedPerson(activity);
    setIsOpen(true);
    setResults([]);
    setQuery('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder="Search people..."
          className="input pl-10"
          autoComplete="off"
        />
      </div>

      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm text-gray-500 z-20">
          Searching...
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto z-20">
          {results.map((person) => {
            const fullName = person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown';
            const details = [person.title, person.companyName].filter(Boolean).join(' • ');
            return (
              <button
                key={person._id}
                type="button"
                onClick={() => openPerson(person)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <span className="block text-sm font-medium text-gray-800">{fullName}</span>
                {details && <span className="block text-xs text-gray-500">{details}</span>}
              </button>
            );
          })}
        </div>
      )}

      {selectedPerson && (
        <ActivityDetailModal
          isOpen={isOpen}
          activity={selectedPerson}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
