import React from 'react';

export function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div className={`${sizeClasses[size] || sizeClasses.md} border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin`} />
    </div>
  );
}