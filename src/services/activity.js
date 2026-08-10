import { api } from './api';

export const activityService = {
  /**
   * Fetch activity feed
   * @param {Object} params - Query parameters
   * @param {string} params.channel - 'linkedin' | 'email' | 'all' (default: 'all')
   * @param {string} params.direction - 'inbound' | 'outbound' | 'all' (default: 'all')
   * @param {string} params.timeRange - 'today' | 'yesterday' | 'last_3_days' | 'last_7_days' | 'last_30_days' (default: 'last_7_days')
   * @param {number} params.limit - Number of activities (default: 20, max: 100)
   * @param {string} params.cursor - ISO date string for pagination
   * @returns {Promise<Object>} Activity data with pagination
   */
  async fetchActivity(params = {}) {
    try {
      const {
        channel = 'all',
        direction = 'all',
        timeRange = 'last_7_days',
        limit = 20,
        cursor = null
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('channel', channel);
      queryParams.append('direction', direction);
      queryParams.append('timeRange', timeRange);
      queryParams.append('limit', limit.toString());
      if (cursor) {
        queryParams.append('cursor', cursor);
      }

      const response = await api.get(`/activity?${queryParams.toString()}`);
      
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      console.error('Error fetching activity:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || 'Failed to fetch activity'
      };
    }
  },

  /**
   * Fetch activity counts by time range
   * @param {Object} params - Query parameters
   * @param {string} params.channel - 'linkedin' | 'email' | 'all' (default: 'all')
   * @param {string} params.direction - 'inbound' | 'outbound' | 'all' (default: 'all')
   * @returns {Promise<Object>} Activity counts
   */
  async fetchActivityCounts(params = {}) {
    try {
      const {
        channel = 'all',
        direction = 'all'
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('channel', channel);
      queryParams.append('direction', direction);

      const response = await api.get(`/activity/counts?${queryParams.toString()}`);
      
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      console.error('Error fetching activity counts:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || 'Failed to fetch activity counts'
      };
    }
  },

  /**
   * Get relative time string (e.g., "2 min ago", "3 hours ago", "Yesterday")
   * @param {Date} date - The date to format
   * @returns {string} Relative time string
   */
  getRelativeTime(date) {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay === 0) {
      if (diffHour === 0) {
        if (diffMin === 0) {
          return 'Just now';
        }
        return `${diffMin} min ago`;
      }
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay === 1) {
      return 'Yesterday';
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  },

  /**
   * Format date for display (full date + time)
   * @param {Date} date - The date to format
   * @returns {string} Formatted date string
   */
  formatFullDate(date) {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  },

  /**
   * Truncate message for preview
   * @param {string} message - The message to truncate
   * @param {number} maxLength - Maximum length (default: 120)
   * @returns {string} Truncated message
   */
  truncateMessage(message, maxLength = 120) {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  },

  /**
   * Get message direction icon
   * @param {string} direction - 'inbound' | 'outbound'
   * @returns {string} Icon emoji
   */
  getDirectionIcon(direction) {
    return direction === 'inbound' ? '📥' : '📤';
  },

  /**
   * Get message direction color
   * @param {string} direction - 'inbound' | 'outbound'
   * @returns {string} Color class
   */
  getDirectionColor(direction) {
    return direction === 'inbound' ? 'text-green-600 bg-green-50 border-green-200' : 'text-blue-600 bg-blue-50 border-blue-200';
  },

  /**
   * Get channel icon
   * @param {string} channel - 'linkedin' | 'email'
   * @returns {string} Icon emoji
   */
  getChannelIcon(channel) {
    return channel === 'linkedin' ? '🔗' : '📧';
  },

  /**
   * Get channel label
   * @param {string} channel - 'linkedin' | 'email'
   * @returns {string} Channel label
   */
  getChannelLabel(channel) {
    return channel === 'linkedin' ? 'LinkedIn' : 'Email';
  },

  /**
   * Group activities by date
   * @param {Array} activities - Array of activity objects
   * @returns {Object} Grouped activities by date key
   */
  groupActivitiesByDate(activities) {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    activities.forEach(activity => {
      const date = new Date(activity.sentAt);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });

    // Sort groups by date (newest first)
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    const sortedGroups = {};
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  },

  /**
   * Get label for a date group
   * @param {string} dateKey - Date string (YYYY-MM-DD)
   * @returns {string} Group label
   */
  getGroupLabel(dateKey) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateKey === todayStr) {
      return 'Today';
    } else if (dateKey === yesterdayStr) {
      return 'Yesterday';
    } else {
      const date = new Date(dateKey);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }
  }
};