import React, { useState, useEffect, useRef } from 'react';
import { Menu } from '@headlessui/react';
import { useAuthStore, useAppStore, useUIStore } from '../../store';
import { api } from '../../services/api';
import {
  Link2,
  Mail,
  LogOut,
  LoaderCircle,
  CircleCheck,
  CircleAlert,
} from 'lucide-react';

export function UserMenu() {
  const { user, client, agencyClient, logout } = useAuthStore();
  const { activeClientId } = useAppStore();
  const { userMenuOpenSignal } = useUIStore();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (userMenuOpenSignal > 0) {
      buttonRef.current?.click();
    }
  }, [userMenuOpenSignal]);

  const [linkedinStatus, setLinkedinStatus] = useState({
    connected: false,
    status: 'checking',
    checking: true,
    unipileAccountId: null,
    needsReconnect: false,
  });
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkError, setLinkError] = useState(null);

  const [emailStatus, setEmailStatus] = useState({
    connected: false,
    checking: true,
    email: null,
  });
  const [isConnectingEmail, setIsConnectingEmail] = useState(false);
  const [emailError, setEmailError] = useState(null);

  // ---- derived identity -------------------------------------------------
  const displayName =
    client?.name ||
    client?.client?.name ||
    user?.client?.name ||
    user?.email ||
    'User';
  const email = user?.email || '';

  const isAgency = agencyClient?.isAgency || false;
  const agencyId = agencyClient?.id || agencyClient?._id || null;
  const isAgencyViewingChild =
    isAgency && activeClientId && agencyId && activeClientId !== agencyId;

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // ---- status polling ---------------------------------------------------
  useEffect(() => {
    const checkLinkedInStatus = async () => {
      try {
        const response = await api.get('/api/activity/linkedin-status');
        if (response.data) {
          const needsReconnect =
            response.data.status === 'invalid_session' ||
            response.data.status === 'disconnected' ||
            response.data.status === 'orphaned' ||
            response.data.status === 'error';

          setLinkedinStatus({
            connected: response.data.connected || false,
            status: response.data.status || 'unknown',
            checking: false,
            unipileAccountId: response.data.unipileAccountId || null,
            needsReconnect: needsReconnect && !!response.data.unipileAccountId,
          });
        }
      } catch {
        setLinkedinStatus({
          connected: false,
          status: 'error',
          checking: false,
          unipileAccountId: null,
          needsReconnect: false,
        });
      }
    };

    checkLinkedInStatus();
    const id = setInterval(checkLinkedInStatus, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const checkEmailStatus = async () => {
      try {
        const response = await api.get('/auth/email/status');
        setEmailStatus({
          connected: !!response.data?.connected,
          email: response.data?.email || null,
          checking: false,
        });
      } catch {
        setEmailStatus({ connected: false, checking: false, email: null });
      }
    };

    checkEmailStatus();
    const id = setInterval(checkEmailStatus, 60000);
    return () => clearInterval(id);
  }, []);

  // ---- LinkedIn connect / reconnect -------------------------------------
  const generateLink = async (isReconnect) => {
    let targetClientId = isAgencyViewingChild ? activeClientId : client?._id || client?.id;

    if (!targetClientId || targetClientId === 'undefined') {
      try {
        const storedClient = localStorage.getItem('client');
        if (storedClient) {
          const parsed = JSON.parse(storedClient);
          targetClientId = parsed?._id || parsed?.id;
        }
      } catch {
        /* ignore */
      }
    }

    if (!targetClientId || targetClientId === 'undefined') {
      setLinkError('Unable to determine client. Please refresh and try again.');
      return;
    }

    setIsGeneratingLink(true);
    setLinkError(null);

    try {
      const endpoint = isReconnect
        ? '/linkedin/generate-reconnect-link'
        : '/linkedin/generate-link';
      const response = await api.post(endpoint, { clientId: targetClientId });

      if (response.data.success) {
        if (isAgencyViewingChild) {
          setGeneratedLink(response.data.url);
          setShowLinkModal(true);
        } else {
          window.location.href = response.data.url;
        }
      } else {
        setLinkError(response.data.message || 'Failed to generate link');
      }
    } catch (error) {
      if (error.response?.data?.error === 'already_connected' && !isReconnect) {
        setLinkError('This client already has a LinkedIn account connected.');
        try {
          const statusResponse = await api.get('/api/activity/linkedin-status');
          if (statusResponse.data) {
            setLinkedinStatus({
              connected: statusResponse.data.connected || false,
              status: statusResponse.data.status || 'unknown',
              checking: false,
              unipileAccountId: statusResponse.data.unipileAccountId || null,
              needsReconnect: false,
            });
          }
        } catch {
          /* ignore */
        }
      } else {
        setLinkError(error.response?.data?.message || 'Failed to generate connection link');
      }
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyLinkToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard
        .writeText(generatedLink)
        .then(() => {
          const btn = document.getElementById('copyLinkBtn');
          if (btn) {
            btn.textContent = 'Copied!';
            setTimeout(() => {
              btn.textContent = 'Copy Link';
            }, 3000);
          }
        })
        .catch(() => setLinkError('Failed to copy link. Please copy it manually.'));
    }
  };

  // ---- Email connect / disconnect ---------------------------------------
  const handleConnectEmail = async () => {
    setIsConnectingEmail(true);
    setEmailError(null);
    try {
      const response = await api.get('/auth/email/connect');
      if (response.data?.connectionUrl) {
        window.location.href = response.data.connectionUrl;
        return;
      }
      setEmailError('No connection URL returned. Please try again.');
    } catch (error) {
      const status = error.response?.status;
      const code = error.response?.data?.error;

      if (status === 409 && code === 'already_connected') {
        try {
          const st = await api.get('/auth/email/status');
          setEmailStatus({
            connected: !!st.data?.connected,
            email: st.data?.email || null,
            checking: false,
          });
        } catch {
          /* ignore */
        }
        return;
      }

      setEmailError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to generate email connection link'
      );
    } finally {
      setIsConnectingEmail(false);
    }
  };

  const handleDisconnectEmail = async () => {
    if (!window.confirm('Disconnect your email account? This will pause all email campaigns.')) {
      return;
    }
    setEmailError(null);
    try {
      await api.post('/auth/email/disconnect');
      setEmailStatus({ connected: false, checking: false, email: null });
    } catch (error) {
      setEmailError(error.response?.data?.error || 'Failed to disconnect email');
    }
  };

  // ---- derived status displays ------------------------------------------
  const linkedinLabel = linkedinStatus.checking
    ? 'Checking…'
    : linkedinStatus.connected
    ? 'Connected'
    : 'Disconnected';
  const emailLabel = emailStatus.checking
    ? 'Checking…'
    : emailStatus.connected
    ? 'Connected'
    : 'Disconnected';

  const showLinkedinReconnect =
    !linkedinStatus.checking &&
    !linkedinStatus.connected &&
    linkedinStatus.needsReconnect &&
    linkedinStatus.unipileAccountId;
  const showLinkedinConnect =
    !linkedinStatus.checking &&
    !linkedinStatus.connected &&
    !linkedinStatus.unipileAccountId;

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        ref={buttonRef}
        className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold grid place-items-center hover:bg-primary-200 transition-colors focus:outline-none"
        aria-label="Account menu"
      >
        {initials}
      </Menu.Button>

      <Menu.Items className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg z-50 focus:outline-none">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
          {email && <p className="text-xs text-gray-500 truncate">{email}</p>}
        </div>

        {/* LinkedIn */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <Link2 size={16} className="text-gray-400" />
              LinkedIn
            </span>
            <StatusBadge
              checking={linkedinStatus.checking}
              connected={linkedinStatus.connected}
              label={linkedinLabel}
            />
          </div>

          {(showLinkedinConnect || showLinkedinReconnect) && (
            <button
              onClick={() => generateLink(showLinkedinReconnect)}
              disabled={isGeneratingLink}
              className="mt-2 w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50"
            >
              {isGeneratingLink && <LoaderCircle size={14} className="animate-spin" />}
              {showLinkedinReconnect ? 'Reconnect LinkedIn' : 'Connect LinkedIn'}
            </button>
          )}

          {linkError && <p className="mt-1 text-xs text-red-500">{linkError}</p>}
        </div>

        {/* Email */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <Mail size={16} className="text-gray-400" />
              Email
            </span>
            <StatusBadge
              checking={emailStatus.checking}
              connected={emailStatus.connected}
              label={emailLabel}
            />
          </div>

          {emailStatus.email && (
            <p className="text-xs text-gray-400 mt-1 truncate" title={emailStatus.email}>
              {emailStatus.email}
            </p>
          )}

          {!emailStatus.checking && !emailStatus.connected && (
            <button
              onClick={handleConnectEmail}
              disabled={isConnectingEmail}
              className="mt-2 w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50"
            >
              {isConnectingEmail && <LoaderCircle size={14} className="animate-spin" />}
              Connect Email
            </button>
          )}

          {!emailStatus.checking && emailStatus.connected && (
            <button
              onClick={handleDisconnectEmail}
              className="mt-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              Disconnect
            </button>
          )}

          {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
        </div>

        <div className="p-1">
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={logout}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                }`}
              >
                <LogOut size={16} className="text-gray-400" />
                Logout
              </button>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>

      {/* Share-link modal (agency viewing child) */}
      {showLinkModal && generatedLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">LinkedIn Connection Link</h3>
            <p className="text-sm text-gray-600 mb-4">
              Share this link with the client so they can connect their LinkedIn account:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
              <p className="text-xs text-gray-700 break-all font-mono">{generatedLink}</p>
            </div>
            <div className="flex gap-2">
              <button
                id="copyLinkBtn"
                onClick={copyLinkToClipboard}
                className="flex-1 btn-primary text-sm"
              >
                Copy Link
              </button>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setGeneratedLink(null);
                }}
                className="flex-1 btn-secondary text-sm"
              >
                Close
              </button>
            </div>
            {linkError && <p className="text-xs text-red-500 mt-2">{linkError}</p>}
          </div>
        </div>
      )}
    </Menu>
  );
}

function StatusBadge({ checking, connected, label }) {
  if (checking) {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <LoaderCircle size={12} className="animate-spin" />
        {label}
      </span>
    );
  }
  return (
    <span
      className={`flex items-center gap-1 text-xs ${
        connected ? 'text-green-600' : 'text-red-600'
      }`}
    >
      {connected ? <CircleCheck size={12} /> : <CircleAlert size={12} />}
      {label}
    </span>
  );
}
