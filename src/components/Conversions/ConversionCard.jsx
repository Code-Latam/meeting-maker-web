import React from 'react';
import { conversionService } from '../../services/conversionService';

export function ConversionCard({ conversion, onClick }) {
  const {
    personName,
    personTitle,
    personCompany,
    channel,
    convertedAt,
    conversionType,
    meetingIntent,
    linkedinPublicId
  } = conversion;

  const channelIcon = conversionService.getChannelIcon(channel);
  const channelLabel = conversionService.getChannelLabel(channel);
  const relativeTime = conversionService.getRelativeTime(convertedAt);
  const fullDate = conversionService.formatFullDate(convertedAt);
  const typeLabel = conversionService.getConversionTypeLabel(conversionType);
  const typeColor = conversionService.getConversionTypeColor(conversionType);

  const handleClick = () => {
    if (onClick) {
      onClick(conversion);
    }
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
      className={`bg-white rounded-xl border ${typeColor} p-4 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]`}
      onClick={handleClick}
    >
      {/* Header: Person name, time, conversion type */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-lg flex-shrink-0">🎯</span>
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

      {/* Conversion Details */}
      <div className="mt-2 text-sm text-gray-700">
        <span className="font-medium">{typeLabel}</span>
        <span className="text-gray-400 mx-1">•</span>
        <span>{channelIcon} {channelLabel}</span>
      </div>

      {/* Footer: Channel, conversion type, LinkedIn */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${typeColor}`}>
          {typeLabel}
        </span>
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
          {channelIcon} {channelLabel}
        </span>
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
        {meetingIntent && meetingIntent !== 'unknown' && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
            📊 {meetingIntent.replace('_', ' ')}
          </span>
        )}
      </div>
    </div>
  );
}