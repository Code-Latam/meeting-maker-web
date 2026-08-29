// src/components/WebsiteModal.jsx

import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store';
import { api } from '../../services/api';  // ✅ Use api instead of fetch
import { Modal } from '../Common/Modal';

export function WebsiteModal({ isOpen, onClose, onSave, existingData }) {
  const { showToast } = useUIStore();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [websiteData, setWebsiteData] = useState(null);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingData) {
        setWebsiteData(existingData);
        setUrl(existingData.url || '');
      } else {
        setUrl('');
        setWebsiteData(null);
        setError(null);
      }
    }
  }, [isOpen, existingData]);

  const handleFetchWebsite = async () => {
    if (!url.trim()) {
      showToast('Please enter a website URL', 'error');
      return;
    }

    // Validate URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      showToast('Please enter a valid URL (include http:// or https://)', 'error');
      return;
    }

    setIsFetching(true);
    setLoading(true);
    setError(null);
    setWebsiteData(null);

    try {
      // ✅ Use api instead of fetch
      const response = await api.post('/api/websites', {
    url: url.trim(),
    forceRefresh: true,
    isPrimary: false
  }, {
    timeout: 180000  // ✅ Increase to 60 seconds (or 120000 for 2 minutes)
  });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch website information');
      }

      const website = data.data;
      setWebsiteData({
        data: website,
        url: url.trim(),
        savedAt: new Date().toISOString()
      });
      showToast('✅ Website information fetched successfully!', 'success');

    } catch (err) {
      console.error('Error fetching website:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch website information';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const handleSave = () => {
    if (!websiteData) {
      showToast('No website data to save', 'error');
      return;
    }
    onSave(websiteData);
    onClose();
  };

  const handleRefresh = () => {
    if (url.trim()) {
      handleFetchWebsite();
    } else {
      showToast('Please enter a URL first', 'error');
    }
  };

  const handleClose = () => {
    setWebsiteData(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'success': { label: '✅ Success', class: 'bg-green-100 text-green-700' },
      'partial': { label: '⚠️ Partial', class: 'bg-yellow-100 text-yellow-700' },
      'error': { label: '❌ Error', class: 'bg-red-100 text-red-700' },
      'timeout': { label: '⏱️ Timeout', class: 'bg-yellow-100 text-yellow-700' }
    };
    const s = statusMap[status] || { label: status || 'Unknown', class: 'bg-gray-100 text-gray-700' };
    return s;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="🌐 Website Information" 
      maxWidth="lg"
      closeOnOutsideClick={false}
    >
      <div className="space-y-4">
        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFetchWebsite();
                }
              }}
              placeholder="https://example.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <button
              type="button"
              onClick={handleFetchWebsite}
              disabled={isFetching}
              className="btn-primary whitespace-nowrap"
            >
              {isFetching ? '⏳ Fetching...' : 'Fetch Website'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter the company's website URL to fetch business information
          </p>
        </div>

        {/* Refresh Button */}
        {websiteData && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetching}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              🔄 Refresh Data
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full"></div>
            <p className="text-gray-500 mt-2 text-sm">Fetching website information...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Results */}
        {websiteData && !loading && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-800">
                  {websiteData.data?.title || 'No title available'}
                </h4>
                {websiteData.data?.status && (
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getStatusBadge(websiteData.data.status).class}`}>
                    {getStatusBadge(websiteData.data.status).label}
                  </span>
                )}
              </div>
            </div>

            {websiteData.data?.aiDescription && (
              <div className="mb-3">
                <p className="text-sm text-gray-600">{websiteData.data.aiDescription}</p>
              </div>
            )}

            {websiteData.data?.businessServices && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Services/Products:</p>
                <div className="bg-white p-3 rounded border border-gray-200 max-h-32 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {websiteData.data.businessServices}
                  </p>
                </div>
              </div>
            )}

            {websiteData.data?.lastFetchedAt && (
              <div className="mt-3 text-xs text-gray-400">
                Last updated: {new Date(websiteData.data.lastFetchedAt).toLocaleString()}
              </div>
            )}

            {websiteData.data?.error && (
              <div className="mt-2 text-xs text-red-600">
                Error: {websiteData.data.error}
              </div>
            )}
          </div>
        )}

        {/* No Data State */}
        {!websiteData && !loading && !error && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-4xl mb-2">🌐</div>
            <p className="text-gray-500 text-sm">Enter a URL and click "Fetch Website" to get started</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSave}
            disabled={!websiteData || loading}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Confirm & Store Data
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          The website data will be stored for later use in persona and services generation
        </p>
      </div>
    </Modal>
  );
}