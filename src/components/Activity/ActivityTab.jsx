import React, { useState, useEffect, useCallback, useRef } from 'react';
import { activityService } from '../../services/activity';
import { useUIStore } from '../../store';
import { ActivityFilters } from './ActivityFilters';
import { ActivityGroup } from './ActivityGroup';
import { ActivitySkeleton } from './ActivitySkeleton';
import { ActivityDetailModal } from './ActivityDetailModal';

export function ActivityTab() {
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activities, setActivities] = useState([]);
  const [groupedActivities, setGroupedActivities] = useState({});
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [counts, setCounts] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Filters
  const [timeRange, setTimeRange] = useState('last_7_days');
  const [channel, setChannel] = useState('all');
  const [direction, setDirection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const initialLoadDone = useRef(false);

  // ============================================================
  // LOAD ACTIVITIES
  // ============================================================

  const loadActivities = useCallback(async (cursor = null, append = false) => {
    const isLoadMore = append && cursor;
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      // When search is active, use a larger time range to find all matches
      // For search, we want to search across all time, not just the selected timeRange
      const effectiveTimeRange = searchQuery.trim() ? 'last_30_days' : timeRange;
      
      const result = await activityService.fetchActivity({
        timeRange: effectiveTimeRange,
        channel: searchQuery.trim() ? 'all' : channel, // When searching, search all channels
        direction: searchQuery.trim() ? 'all' : direction, // When searching, search all directions
        limit: 20,
        cursor: cursor || null,
        search: searchQuery
      });

      if (result.success && result.data) {
        const newActivities = result.data.activities || [];
        const hasMoreData = result.data.pagination?.hasMore || false;
        const nextCursorData = result.data.pagination?.nextCursor || null;

        if (append) {
          setActivities(prev => [...prev, ...newActivities]);
        } else {
          setActivities(newActivities);
        }

        setHasMore(hasMoreData);
        setNextCursor(nextCursorData);
      } else {
        showToast(result.error || 'Failed to load activity', 'error');
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      showToast('Failed to load activity feed', 'error');
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [timeRange, channel, direction, searchQuery, showToast]);

  // ============================================================
  // LOAD COUNTS
  // ============================================================

  const loadCounts = useCallback(async () => {
    try {
      const result = await activityService.fetchActivityCounts({
        channel: searchQuery.trim() ? 'all' : channel,
        direction: searchQuery.trim() ? 'all' : direction
      });

      if (result.success && result.data) {
        setCounts(result.data);
      }
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  }, [channel, direction, searchQuery]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadActivities();
      loadCounts();
    }
  }, []);

  // ============================================================
  // FILTER CHANGES
  // ============================================================

  useEffect(() => {
    if (initialLoadDone.current) {
      // Reset activities and load with new filters
      setActivities([]);
      setHasMore(false);
      setNextCursor(null);
      loadActivities();
      loadCounts();
    }
  }, [timeRange, channel, direction, searchQuery]);

  // ============================================================
  // LOAD MORE
  // ============================================================

  const handleLoadMore = () => {
    if (hasMore && nextCursor && !loadingMore) {
      loadActivities(nextCursor, true);
    }
  };

  // ============================================================
  // FILTER HANDLERS
  // ============================================================

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    setIsSearchActive(false);
  };

  const handleChannelChange = (value) => {
    setChannel(value);
    setIsSearchActive(false);
  };

  const handleDirectionChange = (value) => {
    setDirection(value);
    setIsSearchActive(false);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setIsSearchActive(!!value.trim());
  };

  // ============================================================
  // ACTIVITY CLICK HANDLER
  // ============================================================

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    setIsDetailModalOpen(true);
  };

  // ============================================================
  // GROUP ACTIVITIES
  // ============================================================

  useEffect(() => {
    if (activities.length > 0) {
      const grouped = activityService.groupActivitiesByDate(activities);
      setGroupedActivities(grouped);
    } else {
      setGroupedActivities({});
    }
  }, [activities]);

  // ============================================================
  // RENDER
  // ============================================================

  const hasActivities = Object.keys(groupedActivities).length > 0;
  const totalActivities = activities.length;

  if (loading && !initialLoadDone.current) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">📋 Activity</h2>
          <p className="text-sm text-gray-500 mt-1">
            Recent messages from your leads and agents
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
          <h2 className="text-xl font-semibold text-gray-800">📋 Activity</h2>
          <p className="text-sm text-gray-500 mt-1">
            Recent messages from your leads and agents
          </p>
          {isSearchActive && (
            <p className="text-xs text-primary-600 mt-1">
              🔍 Searching for: "{searchQuery}" (searching across all time and channels)
            </p>
          )}
        </div>

        {/* Filters */}
        <ActivityFilters
          timeRange={timeRange}
          channel={channel}
          direction={direction}
          searchQuery={searchQuery}
          onTimeRangeChange={handleTimeRangeChange}
          onChannelChange={handleChannelChange}
          onDirectionChange={handleDirectionChange}
          onSearchChange={handleSearchChange}
          counts={counts}
        />

        {/* Results count */}
        {!loading && (
          <div className="text-xs text-gray-400">
            {totalActivities} activity{totalActivities !== 1 ? 's' : ''} found
            {searchQuery && (
              <span className="text-primary-600"> for "{searchQuery}"</span>
            )}
          </div>
        )}

        {/* Activity Feed */}
        {loading ? (
          <ActivitySkeleton count={3} />
        ) : hasActivities ? (
          <div className="space-y-4">
            {Object.entries(groupedActivities).map(([dateKey, activitiesGroup]) => (
              <ActivityGroup
                key={dateKey}
                dateKey={dateKey}
                activities={activitiesGroup}
                onActivityClick={handleActivityClick}
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
                  'Load More Activities →'
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500 font-medium">No Activity Found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? `No results found for "${searchQuery}"` : 
                channel !== 'all' || direction !== 'all' ? 'Try changing your filters' : 
                'No messages found for this time period'}
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

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        isOpen={isDetailModalOpen}
        activity={selectedActivity}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedActivity(null);
        }}
      />
    </>
  );
}