import React from 'react';
import { MetricCard } from './MetricCard';

export function KPIGrid({ metrics, isRate = false }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          label={metric.label}
          value={metric.value}
          suffix={metric.suffix || ''}
          isRate={isRate || metric.isRate || false}
        />
      ))}
    </div>
  );
}