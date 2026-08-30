// src/components/WebsiteModal.jsx

import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store';
import { api } from '../../services/api';
import { Modal } from '../Common/Modal';

export function WebsiteModal({ isOpen, onClose, onSave, existingData }) {
  const { showToast } = useUIStore();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [websiteData, setWebsiteData] = useState(null);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  
  // Main fields - used for both fetched and manual entry
  const [companyDescription, setCompanyDescription] = useState('');
  const [services, setServices] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingData) {
        setWebsiteData(existingData);
        setUrl(existingData.url || '');
        setCompanyDescription(existingData.data?.aiDescription || existingData.description || '');
        setServices(existingData.data?.businessServices || existingData.services || '');
        setError(null);
      } else {
        setUrl('');
        setWebsiteData(null);
        setError(null);
        setCompanyDescription('');
        setServices('');
      }
    }
  }, [isOpen, existingData]);

  const handleFetchWebsite = async () => {
    if (!url.trim()) {
      showToast('Please enter a website URL', 'error');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      showToast('Please enter a valid URL (include http:// or https://)', 'error');
      return;
    }

    setIsFetching(true);
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/websites', {
        url: url.trim(),
        forceRefresh: true,
        isPrimary: false
      }, {
        timeout: 600000
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch website information');
      }

      const website = data.data;
      
      // ✅ Store the fetched data
      setWebsiteData({
        data: website,
        url: url.trim(),
        savedAt: new Date().toISOString()
      });
      
      // ✅ Populate the editable fields with fetched data
      setCompanyDescription(website.aiDescription || '');
      setServices(website.businessServices || '');
      
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
    // ✅ Build clean data - keep field names backend expects
    const dataToSave = {
      aiDescription: companyDescription,
      businessServices: services,
      title: websiteData?.data?.title || '',
      url: websiteData?.data?.url || url.trim() || '',
      normalizedUrl: websiteData?.data?.normalizedUrl || '',
      status: websiteData?.data?.status || 'manual',
      _id: websiteData?.data?._id || null,
      lastFetchedAt: websiteData?.data?.lastFetchedAt || null,
    };

    // Validate at least one field has content
    if (!companyDescription.trim() && !services.trim()) {
      showToast('Please enter a company description or services', 'error');
      return;
    }

    onSave({
      data: dataToSave,
      url: url.trim() || 'manual-entry',
      savedAt: new Date().toISOString(),
      isManual: !websiteData?.data?._id,
    });
    onClose();
  };

  const handleRefresh = () => {
    if (url.trim()) {
      setWebsiteData(null);
      handleFetchWebsite();
    } else {
      showToast('Please enter a URL first', 'error');
    }
  };

  const handleClose = () => {
    setWebsiteData(null);
    setError(null);
    setLoading(false);
    setCompanyDescription('');
    setServices('');
    setUrl('');
    onClose();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'success': { label: '✅ Success', class: 'bg-green-100 text-green-700' },
      'partial': { label: '⚠️ Partial', class: 'bg-yellow-100 text-yellow-700' },
      'error': { label: '❌ Error', class: 'bg-red-100 text-red-700' },
      'timeout': { label: '⏱️ Timeout', class: 'bg-yellow-100 text-yellow-700' },
      'manual': { label: '✏️ Manual', class: 'bg-blue-100 text-blue-700' }
    };
    const s = statusMap[status] || { label: status || 'Unknown', class: 'bg-gray-100 text-gray-700' };
    return s;
  };

  // ✅ Check if user has customized the content
  const isCustomized = websiteData?.data?._id && 
    (companyDescription !== websiteData.data.aiDescription || 
     services !== websiteData.data.businessServices);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="🌐 Company Information" 
      maxWidth="lg"
      closeOnOutsideClick={false}
    >
      <div className="space-y-4">
        {/* URL Input - Optional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website URL <span className="text-gray-400 text-xs">(optional)</span>
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
            Optional: Enter a URL to fetch business information, or type/paste your details below
          </p>
        </div>

        {/* Refresh Button */}
        {websiteData && websiteData.data?._id && (
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
          <div className="text-center py-4">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full"></div>
            <p className="text-gray-500 mt-2 text-sm">Fetching website information...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* ✅ Company Description - Same field for fetched or manual */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Description <span className="text-gray-400 text-xs">(required)</span>
          </label>
          <textarea
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            rows={6}
            placeholder="Describe your company, what you do, your target audience, and your unique selling points..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
          />
          <p className="text-xs text-gray-500 mt-1">
            Describe your business. This will be used for persona and service generation. You can type, paste, or fetch from a website above.
          </p>
        </div>

        {/* ✅ Services/Products - Same field for fetched or manual */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Services / Products <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <textarea
            value={services}
            onChange={(e) => setServices(e.target.value)}
            rows={4}
            placeholder="List your products and services, with brief descriptions..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
          />
          <p className="text-xs text-gray-500 mt-1">
            List your products/services. You can type, paste, or fetch from a website above.
          </p>
        </div>

        {/* ✅ Fetched Data Summary */}
        {websiteData && websiteData.data?._id && websiteData.data?.title && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                📄 {websiteData.data.title}
              </span>
              {isCustomized ? (
                <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                  ✏️ Customized
                </span>
              ) : (
                websiteData.data?.status && (
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getStatusBadge(websiteData.data.status).class}`}>
                    {getStatusBadge(websiteData.data.status).label}
                  </span>
                )
              )}
            </div>
            {websiteData.data?.lastFetchedAt && (
              <div className="text-xs text-gray-400 mt-1">
                Fetched: {new Date(websiteData.data.lastFetchedAt).toLocaleString()}
              </div>
            )}
            {websiteData.url && (
              <div className="text-xs text-gray-400 mt-1">
                URL: {websiteData.url}
              </div>
            )}
            {isCustomized && (
              <div className="text-xs text-amber-600 mt-2 border-t border-gray-200 pt-2">
                ⚠️ The description and services have been customized and may differ from the website.
              </div>
            )}
          </div>
        )}

        {/* Manual Entry Indicator */}
        {!websiteData?.data?._id && (companyDescription || services) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              ✏️ Manual entry mode - Your description and services will be saved without a website URL
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
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
          Your company description and services will be used for persona and services generation.
        </p>
      </div>
    </Modal>
  );
}