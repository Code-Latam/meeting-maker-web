// src/components/AgentList.js

import React, { useState, useEffect, useRef } from 'react';
import { useAgentStore } from '../../store/agentStore';
import { AgentCard } from './AgentCard';
import { useUIStore, useAuthStore, useAppStore } from '../../store';
import { WebsiteModal } from './WebsiteModal';
import { agentsService } from '../../services/agents';
import { companyProfileService } from '../../services/companyProfile';

export function AgentList({ onEditAgent }) {
  const { agents, isLoading, error, fetchAgents, deleteAgent } = useAgentStore();
  const { showToast } = useUIStore();
  const { client } = useAuthStore();
  const { activeClientId } = useAppStore();

  const clientId = activeClientId || client?.id;

  const [selectedId, setSelectedId] = useState(null);
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);

  const [companyProfile, setCompanyProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const pollTimerRef = useRef(null);

  const [countsMap, setCountsMap] = useState({});
  const [countsLoading, setCountsLoading] = useState(false);

  const loadCompanyProfile = async () => {
    if (!clientId) {
      setCompanyProfile(null);
      setProfileLoading(false);
      return;
    }
    try {
      setProfileLoading(true);
      const res = await companyProfileService.get();
      setCompanyProfile(res.data);
    } catch (e) {
      console.error('[AgentList] Failed to load company profile:', e);
      setCompanyProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    if (!isWebsiteModalOpen) {
      loadCompanyProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWebsiteModalOpen]);

  // Polling: while status is "pending", poll every 5s for up to 5 minutes.
  // The backend is expected to flip status to "ready" or "failed" on its own,
  // but this caps the spinner in case the scraper crashes or hangs.
  useEffect(() => {
    const status = companyProfile?.status;
    if (status !== 'pending') {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
        setPolling(false);
      }
      setPollingTimedOut(false);
      return;
    }

    if (pollTimerRef.current) return; // already polling

    setPolling(true);

    const MAX_ATTEMPTS = 60; // 60 × 5s = 5 minutes
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      try {
        const res = await companyProfileService.get();
        setCompanyProfile(res.data);
        if (res.data?.status !== 'pending') {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          setPolling(false);
          if (res.data?.status === 'ready') {
            showToast('✅ Company profile is ready', 'success');
          } else if (res.data?.status === 'failed') {
            showToast(
              "⚠️ We couldn't read your website. Add company info manually.",
              'error'
            );
          }
          return;
        }
      } catch (e) {
        console.error('[AgentList] Poll failed:', e);
        // Keep polling — a transient network error shouldn't kill the loop
      }

      if (attempts >= MAX_ATTEMPTS) {
        console.warn(
          '[AgentList] Polling stopped after 5 minutes; status still pending'
        );
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        setPolling(false);
        setPollingTimedOut(true);
      }
    };

    pollTimerRef.current = setInterval(tick, 5000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyProfile?.status]);

  const handleWebsiteDataSaved = async (data) => {
    try {
      const res = await companyProfileService.save({
        url: data.url,
        aiDescription: data.aiDescription,
        businessServices: data.businessServices,
      });
      setCompanyProfile(res.data);
      showToast('✅ Company information saved!', 'success');
    } catch (e) {
      console.error('[AgentList] Save failed:', e);
      showToast(
        e.response?.data?.message ||
          e.response?.data?.error ||
          'Failed to save company information',
        'error'
      );
    }
  };

  const handleClearCompanyProfile = async () => {
    if (
      !window.confirm(
        'Are you sure you want to clear the company information for this client?'
      )
    ) {
      return;
    }
    try {
      const res = await companyProfileService.clear();
      setCompanyProfile(res.data);
      showToast('✅ Company information cleared', 'success');
    } catch (e) {
      console.error('[AgentList] Clear failed:', e);
      showToast('Failed to clear company information', 'error');
    }
  };

  const handleOpenWebsiteModal = () => {
    setIsWebsiteModalOpen(true);
  };

  useEffect(() => {
    fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (agents.length === 0) {
      setCountsMap({});
      return;
    }

    const fetchCounts = async () => {
      setCountsLoading(true);
      try {
        const [leadRes, emailRes, articleRes] = await Promise.all([
          agentsService.getLeadCounts(),
          agentsService.getEmailLeadCounts(),
          agentsService.getArticleCounts(),
        ]);

        const newMap = {};
        agents.forEach((agent) => {
          const agentId = agent._id;
          const linkedin = leadRes.success ? leadRes.counts[agentId] || 0 : 0;
          const email = emailRes.success ? emailRes.counts[agentId] || 0 : 0;
          const articles = articleRes.success ? articleRes.counts[agentId] || 0 : 0;
          newMap[agentId] = { linkedin, email, articles };
        });
        setCountsMap(newMap);
      } catch (err) {
        console.error('Failed to fetch agent counts:', err);
      } finally {
        setCountsLoading(false);
      }
    };

    fetchCounts();
  }, [agents]);

  const handleDelete = async (agent) => {
    if (window.confirm(`Are you sure you want to delete "${agent.name}"?`)) {
      const result = await deleteAgent(agent._id);
      if (result.success) {
        showToast('Agent deleted successfully', 'success');
      } else {
        showToast(result.error || 'Failed to delete agent', 'error');
      }
    }
  };

  const website = companyProfile?.website || null;
  const status = companyProfile?.status || 'not_started';
  const hasCompanyInfo =
    !!website && !!(website.aiDescription || website.businessServices);
  const isPending = status === 'pending';
  const isFailed = status === 'failed';

  const modalExistingData = website
    ? {
        data: {
          _id: website._id,
          url: website.url,
          aiDescription: website.aiDescription,
          businessServices: website.businessServices,
          title: website.title,
          normalizedUrl: website.normalizedUrl,
          status: website.status,
          lastFetchedAt: website.lastFetchedAt,
        },
        url: website.url,
      }
    : null;

  // ---------- Company Info Banner ----------
  const renderCompanyBanner = () => {
    // Pending — normal spinner state
    if (isPending && !pollingTimedOut) {
      return (
        <div className="mb-6 p-4 bg-white border border-cyan-200 rounded-lg flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">🏢 Company Information</h3>
            <p className="text-sm text-cyan-700 flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              Setting up your company profile from your website…
            </p>
          </div>
          <button
            onClick={handleOpenWebsiteModal}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Edit manually
          </button>
        </div>
      );
    }

    // Pending — but polling timed out at 5 min
    if (isPending && pollingTimedOut) {
      return (
        <div className="mb-6 p-4 bg-white border border-cyan-200 rounded-lg flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">🏢 Company Information</h3>
            <p className="text-sm text-gray-600">
              ⏳ Still setting up — this is taking longer than usual. You can add
              company info manually while you wait.
            </p>
          </div>
          <button
            onClick={handleOpenWebsiteModal}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            + Add Company Info
          </button>
        </div>
      );
    }

    // Failed
    if (isFailed) {
      return (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">🏢 Company Information</h3>
            <p className="text-sm text-yellow-700">
              ⚠️ We couldn&apos;t read your website. Add company info manually.
            </p>
          </div>
          <button
            onClick={handleOpenWebsiteModal}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            + Add Company Info
          </button>
        </div>
      );
    }

    // ready / not_started
    return (
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700">🏢 Company Information</h3>
          <p className="text-sm text-gray-500">
            {hasCompanyInfo
              ? '✅ Company information has been added'
              : 'Add your company information for better agent generation'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasCompanyInfo && (
            <button
              onClick={handleClearCompanyProfile}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              🗑️ Clear
            </button>
          )}
          <button
            onClick={handleOpenWebsiteModal}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            {hasCompanyInfo ? '📝 Edit Company Info' : '+ Add Company Info'}
          </button>
        </div>
      </div>
    );
  };

  if (isLoading && agents.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-gray-500">{error}</p>
        <button onClick={() => fetchAgents()} className="btn-secondary mt-4">
          Try Again
        </button>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <>
        {renderCompanyBanner()}
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🤖</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Agents Found</h3>
          <p className="text-gray-500 text-sm mb-4">Create your first agent to get started</p>
          <button onClick={() => onEditAgent(null)} className="btn-primary">
            + Create Agent
          </button>
        </div>

        <WebsiteModal
          isOpen={isWebsiteModalOpen}
          onClose={() => setIsWebsiteModalOpen(false)}
          onSave={handleWebsiteDataSaved}
          existingData={modalExistingData}
        />
      </>
    );
  }

  return (
    <>
      {renderCompanyBanner()}

      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-3">
        {agents.map((agent) => {
          const counts = countsMap[agent._id] || { linkedin: 0, email: 0, articles: 0 };
          return (
            <AgentCard
              key={agent._id}
              agent={agent}
              onEdit={() => {
                setSelectedId(agent._id);
                onEditAgent(agent);
              }}
              onDelete={handleDelete}
              isSelected={selectedId === agent._id}
              linkedinCount={counts.linkedin}
              emailCount={counts.email}
              articleCount={counts.articles}
            />
          );
        })}
      </div>

      <WebsiteModal
        isOpen={isWebsiteModalOpen}
        onClose={() => setIsWebsiteModalOpen(false)}
        onSave={handleWebsiteDataSaved}
        existingData={modalExistingData}
      />
    </>
  );
}