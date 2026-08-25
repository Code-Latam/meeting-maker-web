import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore, useAppStore } from '../../store';
import { api } from '../../services/api';

const navItems = [
  { id: 'agents', icon: '🤖', label: 'Agents', path: '/' },
  { id: 'activity', icon: '📋', label: 'Activity', path: '/activity' },
  { id: 'conversions', icon: '🎯', label: 'Conversions', path: '/conversions' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { id: 'boost', icon: '🚀', label: 'Boost', path: '/boost' },
  { id: 'ranking', icon: '📈', label: 'Ranking', path: '/ranking' },
  { id: 'crm', icon: '🏢', label: 'CRM', path: '/crm' },
];

const blogNavItem = { id: 'blog', icon: '📝', label: 'Blog & Post', path: '/blog' };
const agencyNavItems = [{ id: 'agency', icon: '🏢', label: 'Agency', path: '/agency' }];

export function DesktopSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, client, agencyClient, isChildClient } = useAuthStore();
  const { activeClientId } = useAppStore();
  const { isSidebarOpen } = useUIStore();
  const [displayName, setDisplayName] = useState('Loading...');
  const [linkedinStatus, setLinkedinStatus] = useState({
    connected: false,
    status: 'checking',
    checking: true,
    unipileAccountId: null,
    canConnect: false,
    authMethod: null
  });
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkError, setLinkError] = useState(null);

  // Update display name when client changes
  useEffect(() => {
    const getClientName = () => {
      if (client?.name) return client.name;
      if (client?.client?.name) return client.client.name;
      if (user?.client?.name) return user.client.name;
      return null;
    };

    const clientName = getClientName();
    const newDisplayName = clientName || user?.email || 'User';
    setDisplayName(newDisplayName);
  }, [client, user]);

  // Check LinkedIn status
  useEffect(() => {
    let intervalId = null;
    
    const checkLinkedInStatus = async () => {
      try {
        const response = await api.get('/api/activity/linkedin-status');
        if (response.data) {
          setLinkedinStatus({
            connected: response.data.connected || false,
            status: response.data.status || 'unknown',
            checking: false,
            unipileAccountId: response.data.unipileAccountId || null,
            canConnect: response.data.canConnect !== undefined ? response.data.canConnect : !response.data.connected,
            authMethod: response.data.authMethod || null
          });
        }
      } catch (error) {
        console.error('Failed to check LinkedIn status:', error);
        setLinkedinStatus({
          connected: false,
          status: 'error',
          checking: false,
          unipileAccountId: null,
          canConnect: false,
          authMethod: null
        });
      }
    };

    checkLinkedInStatus();
    intervalId = setInterval(checkLinkedInStatus, 60000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // ✅ Determine if agency is viewing a child
  const isAgency = agencyClient?.isAgency || false;
  // ✅ agencyClient uses 'id' not '_id'
  const agencyId = agencyClient?.id || agencyClient?._id || null;

  const isAgencyViewingChild = isAgency && 
                               activeClientId && 
                               agencyId && 
                               activeClientId !== agencyId;

  console.log('📝 isAgency:', isAgency);
  console.log('📝 activeClientId:', activeClientId);
  console.log('📝 agencyId:', agencyId);
  console.log('📝 isAgencyViewingChild:', isAgencyViewingChild);

  // ✅ Determine if we should show the connect button
  const shouldShowConnectButton = () => {
    // Don't show if checking
    if (linkedinStatus.checking) return false;
    
    // Don't show if already connected
    if (linkedinStatus.connected) return false;
    
    // Don't show if canConnect is explicitly false
    if (linkedinStatus.canConnect === false) return false;
    
    // ✅ If user is an agency:
    // - Show button ONLY if viewing a child client
    // - Hide button if on own account
    if (isAgency) {
      return isAgencyViewingChild === true;
    }
    
    // ✅ Non-agency users (regular clients, child clients direct login)
    return true;
  };

  // ✅ Generate connection link
  const handleGenerateLink = async () => {
    console.log('🔗 Generate link clicked');
    console.log('📝 isAgencyViewingChild:', isAgencyViewingChild);

    let targetClientId = null;
    
    // If agency viewing child, use activeClientId
    if (isAgencyViewingChild) {
      targetClientId = activeClientId;
      console.log('📝 Agency viewing child - targetClientId:', targetClientId);
    } else {
      targetClientId = client?._id || client?.id;
      console.log('📝 Direct login - targetClientId:', targetClientId);
    }
    
    if (!targetClientId) {
      try {
        const storedClient = localStorage.getItem('client');
        if (storedClient) {
          const parsedClient = JSON.parse(storedClient);
          targetClientId = parsedClient?._id || parsedClient?.id;
        }
      } catch (e) {
        console.error('Error reading client from localStorage:', e);
      }
    }
    
    if (!targetClientId) {
      setLinkError('Unable to determine client. Please refresh and try again.');
      return;
    }
    
    console.log('✅ Final targetClientId:', targetClientId);
    
    setIsGeneratingLink(true);
    setLinkError(null);
    
    try {
      const response = await api.post('/linkedin/generate-link', {
        clientId: targetClientId
      });
      
      if (response.data.success) {
        if (isAgencyViewingChild) {
          // ✅ Agency viewing child - show link in modal
          console.log('✅ Showing link in modal');
          setGeneratedLink(response.data.url);
          setShowLinkModal(true);
        } else {
          // ✅ Child or regular client - redirect to Unipile
          console.log('✅ Redirecting to Unipile');
          window.location.href = response.data.url;
        }
      } else {
        setLinkError(response.data.message || 'Failed to generate link');
      }
    } catch (error) {
      console.error('Error generating link:', error);
      
      if (error.response?.data?.error === 'already_connected') {
        setLinkError('This client already has a LinkedIn account connected.');
        try {
          const statusResponse = await api.get('/api/activity/linkedin-status');
          if (statusResponse.data) {
            setLinkedinStatus({
              connected: statusResponse.data.connected || false,
              status: statusResponse.data.status || 'unknown',
              checking: false,
              unipileAccountId: statusResponse.data.unipileAccountId || null,
              canConnect: statusResponse.data.canConnect !== undefined ? statusResponse.data.canConnect : !statusResponse.data.connected,
              authMethod: statusResponse.data.authMethod || null
            });
          }
        } catch (statusErr) {
          console.error('Failed to refresh status:', statusErr);
        }
      } else {
        setLinkError(error.response?.data?.message || 'Failed to generate connection link');
      }
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // ✅ Copy link to clipboard
  const copyLinkToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
        .then(() => {
          const btn = document.getElementById('copyLinkBtn');
          if (btn) {
            btn.textContent = '✅ Copied!';
            setTimeout(() => {
              btn.textContent = '📋 Copy Link';
            }, 3000);
          }
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          setLinkError('Failed to copy link. Please copy it manually.');
        });
    }
  };

  if (!isSidebarOpen) return null;

  const isActive = (item) => {
    if (item.id === 'agents' && location.pathname === '/') return true;
    return location.pathname === item.path;
  };

  const getLinkedInStatusDisplay = () => {
    if (linkedinStatus.checking) {
      return { label: 'Checking...', color: 'bg-gray-400', pulse: true };
    }
    if (linkedinStatus.connected) {
      return { label: 'Connected ✅', color: 'bg-green-500', pulse: false };
    }
    if (linkedinStatus.status === 'invalid_session') {
      return { label: 'Session Invalid', color: 'bg-yellow-500', pulse: false };
    }
    return { label: 'Disconnected', color: 'bg-red-500', pulse: false };
  };

  const statusDisplay = getLinkedInStatusDisplay();

  // ✅ Build nav items based on isChildClient from store
  let allNavItems = [];

  if (isChildClient) {
    allNavItems = navItems.filter(item => 
      item.id !== 'agents' && 
      item.id !== 'ranking' && 
      item.id !== 'about'
    );
  } else {
    allNavItems = [...navItems];
  }

  allNavItems.push(blogNavItem);

  if (!isChildClient) {
    allNavItems.push({ id: 'about', icon: 'ℹ️', label: 'About', path: '/about' });
  }

  if (isAgency) {
    allNavItems.push(...agencyNavItems);
  }

  const showConnectButton = shouldShowConnectButton();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Client Name Only */}
      <div className="p-4 border-b border-gray-200">
        <p className="text-lg font-semibold text-gray-800 truncate" title={displayName}>
          {displayName}
        </p>
        {isAgency && (
          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
              🏢 Agency
            </span>
          </div>
        )}
        {isChildClient && (
          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
              📁 Client
            </span>
          </div>
        )}
      </div>
      
      {/* LinkedIn Status + Connect Button */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">🔗 LinkedIn</span>
          <div className="flex items-center gap-2">
            <span 
              className={`w-2.5 h-2.5 rounded-full ${statusDisplay.color} ${statusDisplay.pulse ? 'animate-pulse' : ''}`}
            />
            <span className="text-xs text-gray-600">{statusDisplay.label}</span>
          </div>
        </div>
        
        {/* ✅ Connect Button */}
        {showConnectButton && (
          <div className="mt-2">
            <button
              onClick={handleGenerateLink}
              disabled={isGeneratingLink}
              className={`w-full text-xs py-1.5 px-3 rounded-lg transition-colors ${
                isGeneratingLink 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {isGeneratingLink ? (
                <>
                  <span className="inline-block animate-spin mr-1">⏳</span>
                  Generating...
                </>
              ) : (
                isAgencyViewingChild ? '🔗 Generate Connection Link' : '🔗 Connect LinkedIn'
              )}
            </button>
            {linkError && (
              <p className="text-xs text-red-500 mt-1">{linkError}</p>
            )}
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {allNavItems.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center mb-2 truncate" title={displayName}>
          {displayName}
        </p>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span>Logout</span>
        </button>
      </div>

      {/* ✅ Modal for Agency viewing child - show generated link */}
      {showLinkModal && generatedLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🔗 LinkedIn Connection Link
            </h3>
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
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm py-2 px-4 rounded-lg transition-colors"
              >
                📋 Copy Link
              </button>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setGeneratedLink(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
            {linkError && (
              <p className="text-xs text-red-500 mt-2">{linkError}</p>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}