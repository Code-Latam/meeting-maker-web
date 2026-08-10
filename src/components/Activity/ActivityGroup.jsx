import React, { useState } from 'react';
import { ActivityCard } from './ActivityCard';
import { activityService } from '../../services/activity';

export function ActivityGroup({ dateKey, activities, onActivityClick }) {
  const [expanded, setExpanded] = useState(true);
  const groupLabel = activityService.getGroupLabel(dateKey);
  const count = activities.length;

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="space-y-2">
      {/* Group Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">{groupLabel}</span>
          <span className="text-xs text-gray-400">({count} activities)</span>
        </div>
        <button
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Activities */}
      {expanded && (
        <div className="space-y-3 pl-1">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onClick={onActivityClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}