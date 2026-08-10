import React from 'react';
import { activityService } from '../../services/activity';

export function ActivityCard({ activity, onClick }) {
  const {
    personName,
    personTitle,
    personCompany,
    channel,
    direction,
    message,
    sentAt,
    authorType,
    agentId,
    personId,
    linkedinPublicId,
    threadStage,
    lifecycleState
  } = activity;

  const directionIcon = activityService.getDirectionIcon(direction);
  const directionColor = activityService.getDirectionColor(direction);
  const channelIcon = activityService.getChannelIcon(channel);
  const channelLabel = activityService.getChannelLabel(channel);
  const relativeTime = activityService.getRelativeTime(sentAt);
  const fullDate = activityService.formatFullDate(sentAt);
  const truncatedMessage = activityService.truncateMessage(message, 120);

  const handleClick = () => {
    if (onClick) {
      onClick(activity);
    }
  };

  const getAuthorLabel = () => {
    if (authorType === 'human') {
      return '👤 Prospect';
    }
    if (authorType === 'agent') {
      return `🤖 Agent`;
    }
    return '💬 System';
  };

  const getLifecycleStateLabel = (state) => {
    const stateMap = {
      'open': 'Open',
      'connected': 'Connected',
      'pending-connection': 'Pending Connection',
      'in-conversation': 'In Conversation',
      'paused': 'Paused',
      'converted': 'Converted',
      'irrelevant': 'Irrelevant',
      'do_not_contact': 'Do Not Contact',
      'archived': 'Archived',
      'blocked': 'Blocked'
    };
    return stateMap[state] || state || 'Unknown';
  };

  const getLinkedInUrl = () => {
    if (linkedinPublicId) {
      return `https://www.linkedin.com/in/${linkedinPublicId}/`;
    }
    return null;
  };

  const linkedInUrl = getLinkedInUrl();

  return (
    <div
      className={`bg-white rounded-xl border ${directionColor} p-4 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]`}
      onClick={handleClick}
    >
      {/* Header: Person name, time, direction */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-lg flex-shrink-0">{directionIcon}</span>
          <span className="font-semibold text-sm sm:text-base text-gray-800 truncate">
            {personName || 'Unknown'}
          </span>
          {personTitle && (
            <span className="text-xs text-gray-400 truncate hidden sm:inline">
              • {personTitle}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0" title={fullDate}>
          {relativeTime}
        </span>
      </div>

      {/* Company (if available) */}
      {personCompany && (
        <div className="text-xs text-gray-400 mt-0.5">
          🏢 {personCompany}
        </div>
      )}

      {/* Message - truncated to 2 lines */}
      <div 
        className="mt-2 text-sm text-gray-700 overflow-hidden"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineClamp: 2,
          maxHeight: '3em',
          wordBreak: 'break-word'
        }}
      >
        {truncatedMessage || '(No message content)'}
      </div>

      {/* Footer: Channel, direction, author, lifecycle */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
          {channelIcon} {channelLabel}
        </span>
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
          {direction === 'inbound' ? '⬇️ Inbound' : '⬆️ Outbound'}
        </span>
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
          {getAuthorLabel()}
        </span>
        {lifecycleState && (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
            lifecycleState === 'open' ? 'bg-green-100 text-green-700' :
            lifecycleState === 'converted' ? 'bg-blue-100 text-blue-700' :
            lifecycleState === 'paused' ? 'bg-yellow-100 text-yellow-700' :
            lifecycleState === 'do_not_contact' ? 'bg-red-100 text-red-700' :
            lifecycleState === 'archived' ? 'bg-gray-100 text-gray-500' :
            'bg-gray-100 text-gray-600'
          }`}>
            {getLifecycleStateLabel(lifecycleState)}
          </span>
        )}
        {linkedInUrl && (
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            🔗 LinkedIn
          </a>
        )}
      </div>
      
      {/* Click hint */}
      <div className="mt-2 text-xs text-gray-400 text-center border-t border-gray-100 pt-1">
        Click to view details
      </div>
    </div>
  );
}