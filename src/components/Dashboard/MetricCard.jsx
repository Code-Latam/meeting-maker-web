import React from 'react';

export function MetricCard({ label, value, suffix = '', isRate = false, className = '' }) {
  const displayValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md ${className}`}>
      <div className="text-sm text-gray-500 font-medium">{label}</div>
      <div className={`text-2xl lg:text-3xl font-bold mt-1 ${isRate ? 'text-primary-600' : 'text-gray-800'}`}>
        {displayValue.toLocaleString()}{suffix}
      </div>
    </div>
  );
}