// src/components/WebsiteModal.jsx

import React, { useState, useEffect, useRef } from 'react';
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
  const [elapsedSec, setElapsedSec] = useState(0);

  const [companyDescription, setCompanyDescription] = useState('');
  const [services, setServices] = useState('');

  // Refs for cancelable polling
  const cancelRef = useRef(false);
  const elapsedTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (existingData) {
        setWebsiteData(existingData);
        setUrl(existingData.url || '');
        setCompanyDescription(existingData.data?.aiDescription || '');
        setServices(existingData.data?.businessServices || '');
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRef.current = true;
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, []);

  const fillFromWebsite = (website) => {
    setWebsiteData({
      data: website,
      url: website.url || url.trim(),
      savedAt: new Date().toISOString(),
    });
    setCompanyDescription(website.aiDescription || '');
    setServices(website.businessServices || '');
  };

  const handleFetchWebsite = async () => {
    if (!url.trim()) {
      showToast('Please enter a website URL', 'error');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      showToast('Please enter a valid URL (include http:// or https://)', 'error');
      return;
    }

    cancelRef.current = false;
    setIsFetching(true);
    setLoading(true);
    setError(null);
    setElapsedSec(0);

    // Start elapsed timer
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);

    try {
      // 1. Kick off the scrape — returns immediately
      const startRes = await api.post(
        '/api/websites',
        {
          url: url.trim(),
          forceRefresh: true,
          isPrimary: true,
        },
        { timeout: 30000 } // short timeout, since this returns immediately
      );

      const startData = startRes.data;
      if (!startData.success) {
        throw new Error(startData.message || 'Failed to start website fetch');
      }

      const { jobId, status } = startData;

      // Fast path: cached success, no scrape needed
      if (status === 'success') {
        const pollRes = await api.get(`/api/websites/${jobId}/poll`);
        fillFromWebsite(pollRes.data.data);
        showToast('✅ Website information loaded', 'success');
        return;
      }

      // 2. Poll until status is no longer "processing"
      const POLL_INTERVAL_MS = 3000;
      const MAX_ATTEMPTS = 100; // ~5 minutes
      let attempt = 0;

      while (attempt < MAX_ATTEMPTS) {
        if (cancelRef.current) {
          showToast('Fetch canceled', 'info');
          return;
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        attempt++;

        if (cancelRef.current) {
          showToast('Fetch canceled', 'info');
          return;
        }

        const pollRes = await api.get(`/api/websites/${jobId}/poll`);
        const website = pollRes.data.data;

        if (!website) continue;

        if (website.status === 'success' || website.status === 'partial') {
          fillFromWebsite(website);
          showToast(
            website.status === 'partial'
              ? '⚠️ Website fetched (AI enrichment partially failed)'
              : '✅ Website information fetched successfully!',
            website.status === 'partial' ? 'warning' : 'success'
          );
          return;
        }

        if (website.status === 'error' || website.status === 'timeout') {
          throw new Error(
            website.error || 'Failed to fetch website information'
          );
        }
        // status === 'processing' → keep polling
      }

      throw new Error('Timed out waiting for website fetch (5 minutes)');
    } catch (err) {
      if (cancelRef.current) {
        // User canceled — no error toast
        return;
      }
      console.error('❌ [WebsiteModal] Error fetching website:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to fetch website information';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      setLoading(false);
      setIsFetching(false);
    }
  };

  const handleCancelFetch = () => {
    cancelRef.current = true;
  };

  const handleSave = () => {
    if (!companyDescription.trim() && !services.trim()) {
      showToast('Please enter a company description or services', 'error');
      return;
    }
    onSave({
      url: url.trim() || '',
      aiDescription: companyDescription,
      businessServices: services,
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
    cancelRef.current = true;
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    setWebsiteData(null);
    setError(null);
    setLoading(false);
    setIsFetching(false);
    setCompanyDescription('');
    setServices('');
    setUrl('');
    setElapsedSec(0);
    onClose();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      success: { label: '✅ Success', class: 'bg-green-100 text-green-700' },
      partial: { label: '⚠️ Partial', class: 'bg-yellow-100 text-yellow-700' },
      error: { label: '❌ Error', class: 'bg-red-100 text-red-700' },
      timeout: { label: '⏱️ Timeout', class: 'bg-yellow-100 text-yellow-700' },
      manual: { label: '✏️ Manual', class: 'bg-blue-100 text-blue-700' },
      processing: { label: '⏳ Processing', class: 'bg-cyan-100 text-cyan-700' },
    };
    return (
      statusMap[status] || {
        label: status || 'Unknown',
        class: 'bg-gray-100 text-gray-700',
      }
    );
  };

  const isCustomized =
    websiteData?.data?._id &&
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
        {/* URL Input */}
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
                if (e.key === 'Enter' && !isFetching) handleFetchWebsite();
              }}
              placeholder="https://example.com"
              disabled={isFetching}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:bg-gray-50"
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

        {websiteData && websiteData.data?._id && !isFetching && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRefresh}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              🔄 Refresh Data
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-4 bg-cyan-50 border border-cyan-200 rounded-lg">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full"></div>
            <p className="text-cyan-800 mt-3 text-sm font-medium">
              Reading website… this usually takes 30–90 seconds
            </p>
            <p className="text-cyan-600 mt-1 text-xs">
              Elapsed: {elapsedSec}s
            </p>
            <button
              type="button"
              onClick={handleCancelFetch}
              className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Cancel
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Description <span className="text-gray-400 text-xs">(required)</span>
          </label>
          <textarea
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            rows={6}
            disabled={isFetching}
            placeholder="Describe your company, what you do, your target audience, and your unique selling points..."
            className="input resize-y disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Describe your business. This will be used for persona and service generation. You can type, paste, or fetch from a website above.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Services / Products <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <textarea
            value={services}
            onChange={(e) => setServices(e.target.value)}
            rows={4}
            disabled={isFetching}
            placeholder="List your products and services, with brief descriptions..."
            className="input resize-y disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            List your products/services. You can type, paste, or fetch from a website above.
          </p>
        </div>

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
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                      getStatusBadge(websiteData.data.status).class
                    }`}
                  >
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
              <div className="text-xs text-gray-400 mt-1">URL: {websiteData.url}</div>
            )}
            {isCustomized && (
              <div className="text-xs text-amber-600 mt-2 border-t border-gray-200 pt-2">
                ⚠️ The description and services have been customized and may differ from the website.
              </div>
            )}
          </div>
        )}

        {!websiteData?.data?._id && (companyDescription || services) && !isFetching && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              ✏️ Manual entry mode - Your description and services will be saved without a website URL
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || isFetching}
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