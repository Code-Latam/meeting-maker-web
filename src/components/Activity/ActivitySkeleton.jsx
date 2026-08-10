import React from 'react';

export function ActivitySkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-3 w-20 bg-gray-200 rounded"></div>
              </div>
              <div className="h-3 w-full bg-gray-200 rounded"></div>
              <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
              <div className="flex items-center gap-2 pt-1">
                <div className="h-4 w-16 bg-gray-200 rounded-full"></div>
                <div className="h-4 w-20 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}