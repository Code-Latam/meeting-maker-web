import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store';
import { rankingService } from '../../services/ranking';
import { RankingForm } from '../Ranking/RankingForm';
import { RankingSuccess } from '../Ranking/RankingSuccess';
import { RankingRateLimit } from '../Ranking/RankingRateLimit';

export function RankingTab() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState('form'); // 'form' | 'success' | 'rateLimit'
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [rateLimitData, setRateLimitData] = useState(null);

  // Check rate limit on mount if user is logged in and has email
  useEffect(() => {
    const checkRateLimit = async () => {
      if (user?.email) {
        try {
          const result = await rankingService.checkRateLimit(user.email);
          if (result.success && result.data && !result.data.can_audit) {
            setStatus('rateLimit');
            setRateLimitData(result.data);
          }
        } catch (error) {
          // Silently fail - user can still try to submit
          console.error('Error checking rate limit:', error);
        }
      }
    };
    checkRateLimit();
  }, [user]);

  const handleSuccess = (email) => {
    setSubmittedEmail(email);
    setStatus('success');
  };

  const handleRateLimit = (data) => {
    setRateLimitData(data);
    setStatus('rateLimit');
  };

  const handleUpgrade = () => {
    window.open('https://www.meetingmaker.tech/dashboard', '_blank');
  };

  // If rate limit is shown, allow user to try again (in case they want to use a different email)
  const handleTryAgain = () => {
    setStatus('form');
    setRateLimitData(null);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800">📊 LinkedIn Authority Ranking</h2>
        <p className="text-sm text-gray-500 mt-1">
          Get a detailed report comparing your LinkedIn profile to hundreds of peers in your role.
          <br className="hidden sm:inline" />
          One free ranking per day. We'll email you the full report.
        </p>
      </div>

      {/* Form */}
      {status === 'form' && (
        <RankingForm
          onSuccess={handleSuccess}
          onRateLimit={handleRateLimit}
          email={user?.email || ''}
        />
      )}

      {/* Success */}
      {status === 'success' && (
        <RankingSuccess email={submittedEmail} />
      )}

      {/* Rate Limit */}
      {status === 'rateLimit' && (
        <div className="space-y-4">
          <RankingRateLimit data={rateLimitData} />
          <button
            onClick={handleTryAgain}
            className="w-full btn-secondary text-sm"
          >
            Try with a different email
          </button>
        </div>
      )}

      {/* Upgrade CTA */}
      <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl border border-primary-200 p-6 text-center">
        <p className="text-sm font-semibold text-gray-700">
          🚀 Want to increase your score and be in the top 5%?
        </p>
        <p className="text-sm font-semibold text-gray-700 mt-1">
          🚀 Increase your inbound 5X while reaching out to vetted ICP?
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Meeting Maker can track your progress daily and automate your LinkedIn marketing, outreach and inbound handling.
        </p>
        <button
          onClick={handleUpgrade}
          className="mt-3 btn-primary text-sm px-6 py-2"
        >
          Try the Meeting Maker!
        </button>
      </div>
    </div>
  );
}