import React, { useState } from 'react';
import { ConversionCard } from './ConversionCard';
import { conversionService } from '../../services/conversionService';

export function ConversionGroup({ dateKey, conversions, onConversionClick }) {
  const [expanded, setExpanded] = useState(true);
  const groupLabel = conversionService.getGroupLabel(dateKey);
  const count = conversions.length;

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
          <span className="text-xs text-gray-400">({count} conversions)</span>
        </div>
        <button
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Conversions */}
      {expanded && (
        <div className="space-y-3 pl-1">
          {conversions.map((conversion) => (
            <ConversionCard
              key={conversion.id}
              conversion={conversion}
              onClick={onConversionClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}