import { api } from './api';

export const conversionService = {
  /**
   * Fetch conversions
   * @param {Object} params - Query parameters
   * @param {string} params.channel - 'linkedin' | 'email' | 'all' (default: 'all')
   * @param {string} params.timeRange - 'today' | 'yesterday' | 'last_3_days' | 'last_7_days' | 'last_30_days' (default: 'last_7_days')
   * @param {number} params.limit - Number of conversions (default: 20, max: 100)
   * @param {string} params.cursor - ISO date string for pagination
   * @param {string} params.search - Search query for person name (optional)
   * @returns {Promise<Object>} Conversion data with pagination
   */
  async fetchConversions(params = {}) {
    try {
      const {
        channel = 'all',
        timeRange = 'last_7_days',
        limit = 20,
        cursor = null,
        search = ''
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('channel', channel);
      queryParams.append('timeRange', timeRange);
      queryParams.append('limit', limit.toString());
      if (cursor) {
        queryParams.append('cursor', cursor);
      }
      if (search && search.trim()) {
        queryParams.append('search', search.trim());
      }

      const response = await api.get(`/api/conversions?${queryParams.toString()}`);
      
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      console.error('Error fetching conversions:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || 'Failed to fetch conversions'
      };
    }
  },

  /**
   * Fetch conversion counts by time range
   * @param {Object} params - Query parameters
   * @param {string} params.channel - 'linkedin' | 'email' | 'all' (default: 'all')
   * @returns {Promise<Object>} Conversion counts
   */
  async fetchConversionCounts(params = {}) {
    try {
      const {
        channel = 'all'
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('channel', channel);

      const response = await api.get(`/api/conversions/counts?${queryParams.toString()}`);
      
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      console.error('Error fetching conversion counts:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || 'Failed to fetch conversion counts'
      };
    }
  },

  /**
   * Get relative time string
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
   * Format date for display
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
   * Get conversion type display
   * @param {string} type - The conversion type
   * @returns {string} Display label
   */
  getConversionTypeLabel(type) {
    const typeMap = {
      'meeting_booked': '📅 Meeting Booked',
      'subscription': '📋 Subscription',
      'converted': '🎯 Converted',
      'booked': '📅 Meeting Booked'
    };
    return typeMap[type] || '🎯 Converted';
  },

  /**
   * Get conversion type color
   * @param {string} type - The conversion type
   * @returns {string} Color class
   */
  getConversionTypeColor(type) {
    const colorMap = {
      'meeting_booked': 'bg-green-50 border-green-200 text-green-800',
      'subscription': 'bg-blue-50 border-blue-200 text-blue-800',
      'booked': 'bg-green-50 border-green-200 text-green-800',
      'converted': 'bg-yellow-50 border-yellow-200 text-yellow-800'
    };
    return colorMap[type] || 'bg-purple-50 border-purple-200 text-purple-800';
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
   * Group conversions by date
   * @param {Array} conversions - Array of conversion objects
   * @returns {Object} Grouped conversions by date key
   */
  groupConversionsByDate(conversions) {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    conversions.forEach(conversion => {
      const date = new Date(conversion.convertedAt);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(conversion);
    });

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