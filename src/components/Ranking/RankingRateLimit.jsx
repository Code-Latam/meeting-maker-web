import React from 'react';

export function RankingRateLimit({ data }) {
  const nextAvailable = data?.next_available ? new Date(data.next_available) : null;
  const lastScore = data?.last_score;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
      <div className="text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h3 className="text-xl font-semibold text-yellow-800">Daily Limit Reached</h3>
        <p className="text-yellow-700 text-sm mt-2">
          You've already used your daily ranking for today.
        </p>
        <p className="text-yellow-700 text-sm">
          Come back tomorrow to check your progress again.
        </p>
        {nextAvailable && (
          <p className="text-yellow-700 text-sm mt-3 font-medium">
            🔄 Available: {nextAvailable.toLocaleDateString()} at {nextAvailable.toLocaleTimeString()}
          </p>
        )}
        {lastScore !== undefined && lastScore !== null && (
          <div className="mt-4 bg-white/50 rounded-lg p-4">
            <p className="text-sm text-yellow-700">
              📊 Your last score: <span className="font-bold text-yellow-800">{lastScore}</span>
            </p>
          </div>
        )}
        <div className="mt-6 text-xs text-yellow-600">
          One free ranking per day. Upgrade to Premium for unlimited access.
        </div>
      </div>
    </div>
  );
}