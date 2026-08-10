import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { personsService } from '../services/persons';
import { useUIStore } from '../store';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

export function PersonsPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  
  const [loading, setLoading] = useState(true);
  const [allPersons, setAllPersons] = useState([]);
  const [filteredPersons, setFilteredPersons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [lifecycleStates, setLifecycleStates] = useState([]);
  const [pageInfo, setPageInfo] = useState({ total: 0, page: 1, pages: 1 });
  const [allPersonsCount, setAllPersonsCount] = useState(0);
  
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  
  const [filters, setFilters] = useState({
    funnel: 'linkedin',
    groupId: '',
    lifecycleState: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  // Helper: Check if person belongs to funnel
  const personBelongsToFunnel = (person, funnel) => {
    if (funnel === 'linkedin') {
      return !person.channelPreference || person.channelPreference === 'linkedin';
    } else {
      return person.channelPreference === 'email';
    }
  };

  // Helper: Get thread for channel
  const getThread = (person, funnel) => {
    if (person.threads && person.threads[funnel]) {
      return person.threads[funnel];
    }
    if (person.threads && Array.isArray(person.threads)) {
      const thread = person.threads.find(t => t.channel === funnel);
      if (thread) return thread;
    }
    if (person[funnel]) {
      return person[funnel];
    }
    if (person.lifecycleState) {
      return { lifecycle: { state: person.lifecycleState } };
    }
    return null;
  };

  const getPersonState = (person, funnel) => {
    const thread = getThread(person, funnel);
    let state = null;
    
    if (thread) {
      state = thread.lifecycle?.state || 
              thread.state || 
              thread.lifecycleState ||
              thread.lifecycle?.lifecycleState;
    }
    
    if (!state && person.lifecycleState) {
      state = person.lifecycleState;
    }
    
    return state || (funnel === 'linkedin' ? 'open' : 'no-email-thread');
  };

  // Extract lifecycle states from persons data
  const extractLifecycleStates = useCallback((personsData, funnel) => {
    const states = new Set();
    const relevantPersons = personsData.filter(person => personBelongsToFunnel(person, funnel));
    
    relevantPersons.forEach(person => {
      const state = getPersonState(person, funnel);
      if (state) {
        states.add(state);
      }
    });
    
    return Array.from(states).sort();
  }, []);

  // Apply all filters to allPersons (client-side filtering)
  const applyFilters = useCallback(() => {
    console.log('=== applyFilters called ===');
    console.log('allPersons length:', allPersons.length);
    console.log('filters:', filters);
    
    if (allPersons.length === 0) {
      console.log('No persons to filter - setting empty');
      setFilteredPersons([]);
      setAllPersonsCount(0);
      setPageInfo({ total: 0, page: 1, pages: 1 });
      return;
    }
    
    let results = [...allPersons];
    console.log('Initial results:', results.length);
    
    // Filter by channel preference (funnel)
    results = results.filter(person => personBelongsToFunnel(person, filters.funnel));
    console.log('After funnel filter:', results.length);
    
    // Filter by group
    if (filters.groupId) {
      results = results.filter(person => person.group?._id === filters.groupId);
      console.log('After group filter:', results.length);
    }
    
    // Filter by lifecycle state
    if (filters.lifecycleState) {
      results = results.filter(person => {
        const state = getPersonState(person, filters.funnel);
        return state === filters.lifecycleState;
      });
      console.log('After state filter:', results.length);
    }
    
    // Filter by search (full name)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(person => 
        person.fullName && person.fullName.toLowerCase().includes(searchLower)
      );
      console.log('After search filter:', results.length);
    }
    
    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      results = results.filter(person => {
        if (!person.createdAt) return false;
        const createdDate = new Date(person.createdAt);
        
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (createdDate < fromDate) return false;
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (createdDate > toDate) return false;
        }
        
        return true;
      });
      console.log('After date filter:', results.length);
    }
    
    console.log('Final filtered results:', results.length);
    setFilteredPersons(results);
    setAllPersonsCount(results.length);
    
    const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE) || 1;
    setPageInfo({
      total: results.length,
      page: currentPage > totalPages ? 1 : currentPage,
      pages: totalPages
    });
    
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [allPersons, filters, currentPage]);

  // Load all persons
  const loadAllPersons = useCallback(async () => {
    setLoading(true);
    try {
      const result = await personsService.getAllPersons(agentId);
      
      if (result.success) {
        const personsData = result.items || [];
        console.log('Loaded persons:', personsData.length);
        
        if (personsData.length > 0) {
          console.log('First person structure:', JSON.stringify(personsData[0], null, 2));
        }
        
        // Set all persons first
        setAllPersons(personsData);
        
        // Extract states for both funnels
        const linkedinStates = extractLifecycleStates(personsData, 'linkedin');
        const emailStates = extractLifecycleStates(personsData, 'email');
        
        // Set states based on current funnel
        const currentStates = filters.funnel === 'linkedin' ? linkedinStates : emailStates;
        setLifecycleStates(currentStates);
        
        // Apply filters after data is set
        // Use a function to apply filters with the new data
        applyFiltersWithData(personsData);
        
        setLoading(false);
      } else {
        showToast(result.error || 'Failed to load persons', 'error');
        setAllPersons([]);
        setFilteredPersons([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading persons:', error);
      showToast('Failed to load persons', 'error');
      setAllPersons([]);
      setFilteredPersons([]);
      setLoading(false);
    }
  }, [agentId, filters.funnel, extractLifecycleStates, showToast]);

  // Helper function to apply filters with given data
  const applyFiltersWithData = useCallback((personsData) => {
    console.log('=== applyFiltersWithData called ===');
    console.log('personsData length:', personsData.length);
    console.log('filters:', filters);
    
    if (personsData.length === 0) {
      setFilteredPersons([]);
      setAllPersonsCount(0);
      setPageInfo({ total: 0, page: 1, pages: 1 });
      return;
    }
    
    let results = [...personsData];
    
    // Filter by channel preference (funnel)
    results = results.filter(person => personBelongsToFunnel(person, filters.funnel));
    
    // Filter by group
    if (filters.groupId) {
      results = results.filter(person => person.group?._id === filters.groupId);
    }
    
    // Filter by lifecycle state
    if (filters.lifecycleState) {
      results = results.filter(person => {
        const state = getPersonState(person, filters.funnel);
        return state === filters.lifecycleState;
      });
    }
    
    // Filter by search (full name)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(person => 
        person.fullName && person.fullName.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      results = results.filter(person => {
        if (!person.createdAt) return false;
        const createdDate = new Date(person.createdAt);
        
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (createdDate < fromDate) return false;
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (createdDate > toDate) return false;
        }
        
        return true;
      });
    }
    
    console.log('Filtered results:', results.length);
    setFilteredPersons(results);
    setAllPersonsCount(results.length);
    
    const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE) || 1;
    setPageInfo({
      total: results.length,
      page: 1,
      pages: totalPages
    });
    setCurrentPage(1);
  }, [filters]);

  // Load groups
  const loadGroups = useCallback(async () => {
    try {
      const result = await personsService.getGroups(agentId);
      if (result.success) {
        setGroups(result.groups || []);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  }, [agentId]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      await loadGroups();
      await loadAllPersons();
    };
    loadData();
  }, []);

  // Re-apply filters when any filter changes (except funnel)
  useEffect(() => {
    if (allPersons.length > 0) {
      applyFiltersWithData(allPersons);
    }
  }, [filters.groupId, filters.lifecycleState, filters.search, filters.dateFrom, filters.dateTo]);

  // Handle funnel change separately
  useEffect(() => {
    if (allPersons.length > 0) {
      const states = extractLifecycleStates(allPersons, filters.funnel);
      setLifecycleStates(states);
      // Reset lifecycle state filter when funnel changes
      setFilters(prev => ({ ...prev, lifecycleState: '' }));
      // Re-apply filters with the new funnel
      applyFiltersWithData(allPersons);
    }
  }, [filters.funnel]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(prev => ({
      funnel: prev.funnel,
      groupId: '',
      lifecycleState: '',
      search: '',
      dateFrom: '',
      dateTo: ''
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pageInfo.pages) {
      setCurrentPage(newPage);
    }
  };

  const getCurrentPageItems = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredPersons.slice(start, end);
  };

  const getStatusClass = (state) => {
    const classes = {
      'open': 'bg-green-100 text-green-700',
      'connected': 'bg-blue-100 text-blue-700',
      'pending-connection': 'bg-yellow-100 text-yellow-700',
      'in-conversation': 'bg-indigo-100 text-indigo-700',
      'paused': 'bg-purple-100 text-purple-700',
      'converted': 'bg-yellow-100 text-yellow-700',
      'irrelevant': 'bg-gray-100 text-gray-500',
      'do_not_contact': 'bg-red-100 text-red-700',
      'archived': 'bg-gray-100 text-gray-500',
      'blocked': 'bg-red-100 text-red-700',
      'no-email-thread': 'bg-gray-100 text-gray-500'
    };
    return classes[state] || 'bg-gray-100 text-gray-700';
  };

  const formatState = (state) => {
    if (!state) return 'Unknown';
    if (state === 'no-email-thread') return 'No Email Thread';
    return state.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const renderPersonCard = (person) => {
    const state = getPersonState(person, filters.funnel);
    const groupName = person.group?.name || '';
    const groupDescription = person.group?.description || '';
    const linkedinUrl = person.linkedinProfile?.publicId 
      ? `https://www.linkedin.com/in/${person.linkedinProfile.publicId}/`
      : null;

    return (
      <div
        key={person._id}
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => {
          if (linkedinUrl) {
            window.open(linkedinUrl, '_blank');
          } else {
            showToast('No LinkedIn profile available', 'info');
          }
        }}
      >
        <h3 className="font-semibold text-gray-900">
          {person.fullName || 'Unknown'}
        </h3>
        {person.title && (
          <p className="text-sm text-gray-500 mt-0.5">{person.title}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {groupName && (
            <span 
              className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
              title={groupDescription}
            >
              {groupName}
            </span>
          )}
          <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getStatusClass(state)}`}>
            {formatState(state)}
          </span>
        </div>
        {linkedinUrl && (
          <div className="mt-2 text-xs text-blue-600 hover:underline inline-block">
            View LinkedIn Profile →
          </div>
        )}
      </div>
    );
  };

  const currentItems = getCurrentPageItems();
  const totalPages = Math.ceil(filteredPersons.length / ITEMS_PER_PAGE) || 1;
  const funnelName = filters.funnel === 'linkedin' ? 'LinkedIn' : 'Email';

  if (loading && allPersons.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-flex items-center gap-1"
          >
            ← Back to Agents
          </button>
          <h2 className="text-xl font-semibold text-gray-800">👥 Assigned Persons</h2>
        </div>
        <div className="text-sm text-gray-500">
          {filteredPersons.length} of {allPersons.filter(p => personBelongsToFunnel(p, filters.funnel)).length} {funnelName} persons shown
        </div>
      </div>

      {/* Funnel Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {['linkedin', 'email'].map((funnel) => (
            <button
              key={funnel}
              onClick={() => {
                handleFilterChange('funnel', funnel);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filters.funnel === funnel
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {funnel === 'linkedin' ? '🔗 LinkedIn Funnel' : '📧 Email Funnel'}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Group Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Filter by Group
            </label>
            <select
              value={filters.groupId}
              onChange={(e) => handleFilterChange('groupId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">All Groups</option>
              {groups.map(group => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Filter by State
            </label>
            <select
              value={filters.lifecycleState}
              onChange={(e) => handleFilterChange('lifecycleState', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">All States</option>
              {lifecycleStates.length === 0 ? (
                <option value="" disabled>No states available</option>
              ) : (
                lifecycleStates.map(state => (
                  <option key={state} value={state}>
                    {formatState(state)}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search by Name
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Enter name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <span className="text-gray-400 text-sm">→</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {filters.groupId && `Group: ${groups.find(g => g._id === filters.groupId)?.name || filters.groupId}`}
            {filters.lifecycleState && ` State: ${formatState(filters.lifecycleState)}`}
            {filters.search && ` Search: "${filters.search}"`}
            {filters.dateFrom && filters.dateTo && ` Date: ${filters.dateFrom} → ${filters.dateTo}`}
            {!filters.groupId && !filters.lifecycleState && !filters.search && !filters.dateFrom && !filters.dateTo && 'All records shown'}
          </div>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSpinner />
      ) : currentItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">👤</div>
          <p className="text-gray-500">No persons found matching your filters</p>
          <button
            onClick={clearFilters}
            className="mt-3 text-sm text-primary-600 hover:text-primary-700"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map(renderPersonCard)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}