import React from 'react';

export function RankingSuccess({ email }) {
  return (
    <div className="text-center p-6 bg-white rounded-xl border border-green-200">
      <div className="text-5xl mb-4">📬</div>
      <h3 className="text-xl font-semibold text-green-600">Report Sent!</h3>
      <p className="text-gray-600 mt-2">
        We've sent your LinkedIn Authority Ranking report to:
      </p>
      <p className="text-lg font-semibold text-gray-800 mt-1">{email}</p>
      <p className="text-sm text-gray-500 mt-3">
        ⏳ Check your inbox (and spam folder) in a few minutes.
      </p>
      <p className="text-xs text-gray-400 mt-2">
        🔒 Your email is safe. We'll only send you your report.
      </p>
    </div>
  );
}