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
    linkedinPublicId
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
      return `🤖 Agent${agentId ? '' : ''}`;
    }
    return '💬 System';
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
      className={`bg-white rounded-xl border ${directionColor} p-4 hover:shadow-md transition-shadow cursor-pointer`}
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

      {/* Message */}
      <div className="mt-2 text-sm text-gray-700 line-clamp-2">
        {truncatedMessage || '(No message content)'}
      </div>

      {/* Footer: Channel, direction, author */}
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
        {linkedInUrl && (
          <span className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
            🔗 LinkedIn
          </span>
        )}
      </div>
    </div>
  );
}