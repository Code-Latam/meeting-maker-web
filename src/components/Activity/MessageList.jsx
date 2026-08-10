import React, { useState, useEffect, useCallback } from 'react';
import { crmService } from '../../services/crm';
import { useUIStore } from '../../store';
import { LoadingSpinner } from '../Common/LoadingSpinner';

export function MessageList({ personId, initialChannel = 'all' }) {
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [channel, setChannel] = useState(initialChannel || 'all');

  // Helper: Get channel icon
  const getChannelIcon = (channel) => {
    return channel === 'linkedin' ? '🔗' : '📧';
  };

  // Helper: Get direction icon
  const getDirectionIcon = (direction) => {
    return direction === 'inbound' ? '📥' : '📤';
  };

  // Helper: Get direction label
  const getDirectionLabel = (direction) => {
    return direction === 'inbound' ? 'Inbound' : 'Outbound';
  };

  // Helper: Get direction color
  const getDirectionColor = (direction) => {
    return direction === 'inbound' 
      ? 'bg-green-50 border-green-200' 
      : 'bg-blue-50 border-blue-200';
  };

  // Helper: Get author label
  const getAuthorLabel = (authorType) => {
    if (authorType === 'human') return '👤 Prospect';
    if (authorType === 'agent') return '🤖 Agent';
    return '💬 System';
  };

  // Helper: Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Load messages
  const loadMessages = useCallback(async (cursor = null, append = false) => {
    if (!personId) return;

    const isLoadMore = append && cursor;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await crmService.getPersonMessages(personId, channel, cursor, 20);
      
      if (result.success) {
        const newMessages = result.messages || [];
        const hasMoreData = result.hasMore || false;
        const nextCursorData = result.nextCursor || null;

        if (append) {
          setMessages(prev => [...prev, ...newMessages]);
        } else {
          setMessages(newMessages);
        }

        setHasMore(hasMoreData);
        setNextCursor(nextCursorData);
      } else {
        showToast(result.error || 'Failed to load messages', 'error');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      showToast('Failed to load messages', 'error');
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [personId, channel, showToast]);

  // Reload when channel changes
  useEffect(() => {
    if (personId) {
      setMessages([]);
      setHasMore(false);
      setNextCursor(null);
      loadMessages();
    }
  }, [channel]);

  // Initial load
  useEffect(() => {
    if (personId) {
      loadMessages();
    }
  }, [personId]);

  // Load more messages
  const handleLoadMore = () => {
    if (hasMore && nextCursor && !loadingMore) {
      loadMessages(nextCursor, true);
    }
  };

  // Channel filter buttons
  const ChannelFilter = () => (
    <div className="flex gap-1">
      {['all', 'linkedin', 'email'].map((ch) => (
        <button
          key={ch}
          onClick={() => setChannel(ch)}
          className={`px-3 py-1.5 text-xs rounded-full transition-colors min-h-[32px] ${
            channel === ch
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {ch === 'all' ? '📡 All' : ch === 'linkedin' ? '🔗 LinkedIn' : '📧 Email'}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="space-y-4">
        <ChannelFilter />
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">💬</div>
          <p>No messages found for this person.</p>
          <p className="text-xs text-gray-400 mt-1">
            {channel === 'all' 
              ? 'Messages will appear here once the conversation starts.' 
              : `No ${channel} messages found. Try selecting "All" to see all messages.`}
          </p>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.sentAt);
    const dateKey = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(msg);
    return groups;
  }, {});

  const dateKeys = Object.keys(groupedMessages);

  return (
    <div className="space-y-4">
      {/* Channel Filter */}
      <ChannelFilter />

      {/* Message count */}
      <div className="text-xs text-gray-400">
        {messages.length} message{messages.length !== 1 ? 's' : ''} found
        {channel !== 'all' && (
          <span className="text-primary-600"> in {channel === 'linkedin' ? 'LinkedIn' : 'Email'}</span>
        )}
      </div>

      {/* Messages */}
      {dateKeys.map((dateKey) => (
        <div key={dateKey}>
          <div className="text-xs font-medium text-gray-400 sticky top-0 bg-white py-2 z-10 border-b border-gray-100">
            {dateKey}
          </div>
          <div className="space-y-3 mt-2">
            {groupedMessages[dateKey].map((msg, index) => {
              const isInbound = msg.direction === 'inbound';
              const channelIcon = getChannelIcon(msg.channel);
              const directionIcon = getDirectionIcon(msg.direction);
              const directionLabel = getDirectionLabel(msg.direction);
              const directionColor = getDirectionColor(msg.direction);
              const authorLabel = getAuthorLabel(msg.authorType);
              const timeStr = formatTime(msg.sentAt);

              return (
                <div
                  key={index}
                  className={`rounded-lg border p-3 ${directionColor} transition-colors hover:shadow-sm`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-xs">
                      <span>{channelIcon}</span>
                      <span className="font-medium">{msg.channel === 'linkedin' ? 'LinkedIn' : 'Email'}</span>
                      <span>•</span>
                      <span>{directionIcon} {directionLabel}</span>
                      <span>•</span>
                      <span>{authorLabel}</span>
                    </div>
                    <span className="text-xs text-gray-400" title={formatTime(msg.sentAt)}>
                      {timeStr}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {msg.text || '(No message content)'}
                  </div>
                  {msg.authorType === 'agent' && msg.agentId && (
                    <div className="mt-1 text-xs text-gray-400">
                      Agent ID: {msg.agentId.substring(0, 8)}...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Load More */}
      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingMore ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin"></span>
              Loading...
            </span>
          ) : (
            'Load More Messages ↑'
          )}
        </button>
      )}
    </div>
  );
}