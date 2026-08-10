import React, { useState } from 'react';
import { rankingService } from '../../services/ranking';
import { useUIStore } from '../../store';

export function RankingForm({ onSuccess, onRateLimit, email: defaultEmail }) {
  const { showToast } = useUIStore();
  const [email, setEmail] = useState(defaultEmail || '');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { value: '', label: 'Select your role...' },
    { value: 'saas_founder', label: 'SaaS Founder' },
    { value: 'solopreneur', label: 'Solopreneur' },
    { value: 'ceo', label: 'CEO' },
    { value: 'coo', label: 'COO' },
    { value: 'cko', label: 'CKO' },
    { value: 'cfo', label: 'CFO' },
    { value: 'cio', label: 'CIO' },
    { value: 'cpo', label: 'CPO' },
    { value: 'cmo', label: 'CMO' },
    { value: 'cao', label: 'CAO' },
    { value: 'cvo', label: 'CVO' },
    { value: 'cdo', label: 'CDO' },
    { value: 'cro', label: 'CRO' },
    { value: 'clo', label: 'CLO' },
    { value: 'cso', label: 'CSO' },
    { value: 'cto', label: 'CTO' },
    { value: 'agency_owner', label: 'Agency Owner' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'coach', label: 'Coach' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'head_of_sales', label: 'Head of Sales' },
    { value: 'general', label: 'Executive / Professional' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      showToast('Please enter your email', 'error');
      return;
    }
    if (!linkedinUrl) {
      showToast('Please enter your LinkedIn profile URL', 'error');
      return;
    }
    if (!role) {
      showToast('Please select your role', 'error');
      return;
    }

    // Validate email
    if (!email.includes('@') || !email.includes('.')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    // Validate LinkedIn URL
    if (!linkedinUrl.includes('linkedin.com/in/')) {
      showToast('Please enter a valid LinkedIn profile URL (e.g., linkedin.com/in/username)', 'error');
      return;
    }

    setIsLoading(true);
    const result = await rankingService.submitRanking(email, linkedinUrl, role);
    setIsLoading(false);

    if (result.success) {
      onSuccess(email);
      return;
    }

    // Check if it's a rate limit error (429 status or contains rate limit message)
    const isRateLimit = result.error?.includes('rate limit') || 
                        result.error?.includes('429') ||
                        result.error?.includes('already used') ||
                        result.error?.includes('try again tomorrow');

    if (isRateLimit) {
      // Check rate limit status to get full data
      const rateLimitResult = await rankingService.checkRateLimit(email);
      if (rateLimitResult.success) {
        onRateLimit(rateLimitResult.data);
      } else {
        // Fallback: show a friendly rate limit message
        onRateLimit({
          next_available: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          message: 'You have already used your daily ranking. Please come back tomorrow.'
        });
      }
      return;
    }

    // Generic error
    showToast(result.error || 'Failed to submit ranking request', 'error');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          placeholder="you@example.com"
          required
          disabled={!!defaultEmail}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          LinkedIn Profile URL *
        </label>
        <input
          type="text"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          placeholder="https://www.linkedin.com/in/yourprofile"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Role *
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          required
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary"
      >
        {isLoading ? '⏳ Analyzing...' : 'Get LinkedIn Authority Ranking Report'}
      </button>
    </form>
  );
}