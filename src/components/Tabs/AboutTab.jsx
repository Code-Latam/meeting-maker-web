import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useUIStore } from '../../store';

export function AboutTab() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const [version, setVersion] = useState('1.5.0');
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(true);

  // Fetch plan from API
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const token = localStorage.getItem('jwt');
        const response = await fetch('https://api.meetingmaker.tech/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPlan(data.client?.plan || 'free');
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlan();
  }, []);

  const getPlanDisplay = () => {
    const planMap = {
      'free': { label: 'Free', color: 'text-gray-500', bg: 'bg-gray-100' },
      'postboost': { label: '🚀 Post Boost', color: 'text-purple-600', bg: 'bg-purple-50' },
      'marketing': { label: '📊 Marketing', color: 'text-blue-600', bg: 'bg-blue-50' },
      'premium': { label: '💎 Premium', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    };
    return planMap[plan] || planMap['free'];
  };

  const getFeatures = () => {
    const planMap = {
      'free': {
        features: [
          { name: '🤖 Agents', enabled: false },
          { name: '📊 LinkedIn Authority Ranking', enabled: false },
          { name: '📤 Export Data', enabled: false },
          { name: '📊 Dashboard', enabled: false },
          { name: '🏢 CRM', enabled: false },
          { name: '🚀 Boost Posts', enabled: false }
        ],
        upgradeMessage: 'Upgrade to unlock all features',
        upgradeLink: 'https://www.meetingmaker.tech/dashboard'
      },
      'postboost': {
        features: [
          { name: '🤖 Agents', enabled: false },
          { name: '📊 LinkedIn Authority Ranking', enabled: true },
          { name: '📤 Export Data', enabled: false },
          { name: '📊 Dashboard', enabled: false },
          { name: '🏢 CRM', enabled: false },
          { name: '🚀 Boost Posts', enabled: true }
        ],
        upgradeMessage: 'Upgrade to Marketing or Premium to unlock more features',
        upgradeLink: 'https://www.meetingmaker.tech/dashboard'
      },
      'marketing': {
        features: [
          { name: '🤖 Agents', enabled: true },
          { name: '📊 LinkedIn Authority Ranking', enabled: true },
          { name: '📤 Export Data', enabled: false },
          { name: '📊 Dashboard', enabled: false },
          { name: '🏢 CRM', enabled: true },
          { name: '🚀 Boost Posts', enabled: true }
        ],
        upgradeMessage: 'Upgrade to Premium for CRM access and more agent roles',
        upgradeLink: 'https://www.meetingmaker.tech/dashboard'
      },
      'premium': {
        features: [
          { name: '🤖 Agents', enabled: true },
          { name: '📊 LinkedIn Authority Ranking', enabled: true },
          { name: '📤 Export Data', enabled: true },
          { name: '📊 Dashboard', enabled: true },
          { name: '🏢 CRM', enabled: true },
          { name: '🚀 Boost Posts', enabled: true }
        ],
        upgradeMessage: "You're on the Premium plan - full access!",
        upgradeLink: 'https://www.meetingmaker.tech/dashboard'
      }
    };
    return planMap[plan] || planMap['free'];
  };

  const planDisplay = getPlanDisplay();
  const features = getFeatures();

  const handleUpgrade = () => {
    window.open('https://www.meetingmaker.tech/dashboard', '_blank');
  };

  const handleOnboard = () => {
    window.open('https://www.meetingmaker.tech/onboarding', '_blank');
  };

  const handleHelp = () => {
    navigate('/help');
  };

  const videos = [
    {
      title: 'General Overview of The Meeting Maker',
      url: 'https://youtu.be/A5tk0rz53sI'
    },
    {
      title: 'How to create your own SDR or BDR agent',
      url: 'https://youtu.be/YR6TLKzCZgc'
    },
    {
      title: 'How to create your own Marketing Manager Agent',
      url: 'https://youtu.be/gR5IiO2gMEo'
    },
    {
      title: 'How to Assign prospects to your agents',
      url: 'https://youtu.be/L6PLGWzFmWI'
    },
    {
      title: 'How to track your AI outreach performance',
      url: 'https://youtu.be/xTToS5xjUEg'
    },
    {
      title: 'How to setup an SEO AI Manager Agent',
      url: 'https://youtu.be/oFPYGzWrwtM'
    },
    {
      title: 'How to Set Up Your Astrolab Meeting Maker Account',
      url: 'https://youtu.be/DArEDeVQp5E'
    }
  ];

  const isLoggedIn = !!user;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">The Astrolab Meeting Maker</h2>
        <p className="text-gray-500 text-sm">By Saasential LLC</p>
      </div>

      {/* Plan Badge */}
      <div className="flex justify-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${planDisplay.bg}`}>
          <span className={`text-sm font-medium ${planDisplay.color}`}>
            {planDisplay.label}
          </span>
          {plan !== 'premium' && plan !== 'free' && (
            <span className="text-xs text-gray-400">· {features.features.filter(f => f.enabled).length} features</span>
          )}
        </div>
      </div>

      {/* Version */}
      <div className="text-center text-xs text-gray-400">
        Version {version}
      </div>

      {/* Features Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {features.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className={feature.enabled ? 'text-green-500' : 'text-gray-300'}>
                {feature.enabled ? '✅' : '❌'}
              </span>
              <span className={feature.enabled ? 'text-gray-700' : 'text-gray-400'}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade/Onboard Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {!isLoggedIn ? (
          <button
            onClick={handleOnboard}
            className="btn-primary px-6"
          >
            Create Account
          </button>
        ) : plan === 'premium' ? (
          <div className="text-center text-green-600 text-sm font-medium">
            ✓ Full access
          </div>
        ) : (
          <button
            onClick={handleUpgrade}
            className="btn-primary px-6"
          >
            ⬆️ Upgrade Plan
          </button>
        )}
        <button
          onClick={handleHelp}
          className="btn-secondary px-6"
        >
          📚 View User Guide
        </button>
      </div>

      {/* Instructional Videos */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Instructional Videos
        </h3>
        <div className="space-y-2">
          {videos.map((video, index) => (
            <a
              key={index}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <span className="text-lg">▶️</span>
              <span className="text-sm text-gray-700 hover:text-primary-600 transition-colors">
                {video.title}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-200">
        The Astrolab Meeting Maker v{version} © {new Date().getFullYear()} Saasential LLC
      </div>
    </div>
  );
}