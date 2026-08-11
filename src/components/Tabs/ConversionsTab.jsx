import React, { useState, useEffect, useCallback, useRef } from 'react';
import { conversionService } from '../../services/conversionService';
import { useUIStore } from '../../store';
import { ActivityFilters } from '../Activity/ActivityFilters';
import { ConversionGroup } from '../Conversions/ConversionGroup';
import { ActivitySkeleton } from '../Activity/ActivitySkeleton';
import { ActivityDetailModal } from '../Activity/ActivityDetailModal';

export function ConversionsTab() {
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [conversions, setConversions] = useState([]);
  const [groupedConversions, setGroupedConversions] = useState({});
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [counts, setCounts] = useState([]);
  const [selectedConversion, setSelectedConversion] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Filters
  const [timeRange, setTimeRange] = useState('last_7_days');
  const [channel, setChannel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const initialLoadDone = useRef(false);

  // ============================================================
  // LOAD CONVERSIONS
  // ============================================================

  const loadConversions = useCallback(async (cursor = null, append = false) => {
    const isLoadMore = append && cursor;
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await conversionService.fetchConversions({
        channel,
        timeRange,
        limit: 20,
        cursor: cursor || null,
        search: searchQuery
      });

      if (result.success && result.data) {
        const newConversions = result.data.conversions || [];
        const hasMoreData = result.data.pagination?.hasMore || false;
        const nextCursorData = result.data.pagination?.nextCursor || null;

        if (append) {
          setConversions(prev => [...prev, ...newConversions]);
        } else {
          setConversions(newConversions);
        }

        setHasMore(hasMoreData);
        setNextCursor(nextCursorData);
      } else {
        showToast(result.error || 'Failed to load conversions', 'error');
      }
    } catch (error) {
      console.error('Error loading conversions:', error);
      showToast('Failed to load conversions', 'error');
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [channel, timeRange, searchQuery, showToast]);

  // ============================================================
  // LOAD COUNTS
  // ============================================================

  const loadCounts = useCallback(async () => {
    try {
      const result = await conversionService.fetchConversionCounts({
        channel
      });

      if (result.success && result.data) {
        setCounts(result.data);
      }
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  }, [channel]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadConversions();
      loadCounts();
    }
  }, []);

  // ============================================================
  // FILTER CHANGES
  // ============================================================

  useEffect(() => {
    if (initialLoadDone.current) {
      setConversions([]);
      setHasMore(false);
      setNextCursor(null);
      loadConversions();
      loadCounts();
    }
  }, [channel, timeRange, searchQuery]);

  // ============================================================
  // LOAD MORE
  // ============================================================

  const handleLoadMore = () => {
    if (hasMore && nextCursor && !loadingMore) {
      loadConversions(nextCursor, true);
    }
  };

  // ============================================================
  // FILTER HANDLERS
  // ============================================================

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
  };

  const handleChannelChange = (value) => {
    setChannel(value);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
  };

  // ============================================================
  // CONVERSION CLICK HANDLER
  // ============================================================

  const handleConversionClick = (conversion) => {
  console.log('🔍 Conversion clicked:', conversion);
  console.log('🔍 assignedAgentId:', conversion.assignedAgentId);
  console.log('🔍 groupId:', conversion.groupId);
  console.log('🔍 group:', conversion.group);
  
  // The conversion object now has assignedAgentId and groupId from the backend
  setSelectedConversion(conversion);
  setIsDetailModalOpen(true);
};

  // ============================================================
  // GROUP CONVERSIONS
  // ============================================================

  useEffect(() => {
    if (conversions.length > 0) {
      const grouped = conversionService.groupConversionsByDate(conversions);
      setGroupedConversions(grouped);
    } else {
      setGroupedConversions({});
    }
  }, [conversions]);

  // ============================================================
  // RENDER
  // ============================================================

  const hasConversions = Object.keys(groupedConversions).length > 0;
  const totalConversions = conversions.length;

  if (loading && !initialLoadDone.current) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">🎯 Conversions</h2>
          <p className="text-sm text-gray-500 mt-1">
            People who have converted from your campaigns
          </p>
        </div>
        <ActivitySkeleton count={5} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">🎯 Conversions</h2>
          <p className="text-sm text-gray-500 mt-1">
            People who have converted from your campaigns
          </p>
        </div>

        {/* Filters - reuse ActivityFilters */}
        <ActivityFilters
          timeRange={timeRange}
          channel={channel}
          direction="all"  // No direction filter for conversions
          searchQuery={searchQuery}
          onTimeRangeChange={handleTimeRangeChange}
          onChannelChange={handleChannelChange}
          onSearchChange={handleSearchChange}
          onDirectionChange={() => {}} // No-op for conversions
          counts={counts}
          showDirection={false} 
        />

        {/* Results count */}
        {!loading && (
          <div className="text-xs text-gray-400">
            {totalConversions} conversion{totalConversions !== 1 ? 's' : ''} found
            {searchQuery && (
              <span className="text-primary-600"> for "{searchQuery}"</span>
            )}
          </div>
        )}

        {/* Conversion Feed */}
        {loading ? (
          <ActivitySkeleton count={3} />
        ) : hasConversions ? (
          <div className="space-y-4">
            {Object.entries(groupedConversions).map(([dateKey, conversionsGroup]) => (
              <ConversionGroup
                key={dateKey}
                dateKey={dateKey}
                conversions={conversionsGroup}
                onConversionClick={handleConversionClick}
              />
            ))}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin"></span>
                    Loading...
                  </span>
                ) : (
                  'Load More Conversions →'
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-5xl mb-4">🎯</div>
            <p className="text-gray-500 font-medium">No Conversions Yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? `No conversions found for "${searchQuery}"` : 
                'People who convert from your campaigns will appear here'}
            </p>
          </div>
        )}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-2">
            <span className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin"></span>
          </div>
        )}
      </div>

      {/* Activity Detail Modal - REUSED */}
      <ActivityDetailModal
        isOpen={isDetailModalOpen}
        activity={selectedConversion}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedConversion(null);
        }}
      />
    </>
  );
}