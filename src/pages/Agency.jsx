import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import { api } from '../services/api';
import { AddChildModal } from '../components/Agency/AddChildModal';

export function Agency() {
  const { client } = useAuthStore();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  // Check if user is an agency
  const isAgency = client?.isAgency || false;

  // Fetch children
  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/auth/agency/children');
      setChildren(response.data.children || []);
    } catch (err) {
      console.error('Failed to fetch children:', err);
      setError(err.response?.data?.error || 'Failed to load child clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAgency) {
      fetchChildren();
    }
  }, [isAgency]);

  // Remove child
  const handleRemoveChild = async (childId, childName) => {
    if (!confirm(`Are you sure you want to remove "${childName}" from your agency?`)) {
      return;
    }

    try {
      setRemovingId(childId);
      await api.delete(`/auth/agency/children/${childId}`);
      // Refresh the list
      await fetchChildren();
      // Show success toast or notification if you have one
    } catch (err) {
      console.error('Failed to remove child:', err);
      alert(err.response?.data?.error || 'Failed to remove child client');
    } finally {
      setRemovingId(null);
    }
  };

  // If not agency, show access denied
  if (!isAgency) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-xl font-semibold text-gray-800">Agency Access Only</h2>
          <p className="text-gray-600 mt-1">
            This page is only available for agency accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏢 Agency Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your child clients from one place
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <span>➕</span>
          <span>Add Child Client</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Children</div>
          <div className="text-2xl font-bold text-gray-800">{children.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Active Children</div>
          <div className="text-2xl font-bold text-gray-800">
            {children.filter(c => c.status === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Agency Since</div>
          <div className="text-md font-medium text-gray-800">
            {client?.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Children List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="font-medium text-gray-700">Your Child Clients</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-pulse">Loading...</div>
          </div>
        ) : children.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>No child clients added yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Click "Add Child Client" to get started
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {children.map((child) => (
              <div key={child._id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 truncate">
                      {child.name || child.email}
                    </span>
                    {child.status === 'active' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {child.status || 'Inactive'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {child.email} • {child.plan || 'Free'} • Added: {child.addedToAgencyAt ? new Date(child.addedToAgencyAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveChild(child._id, child.name || child.email)}
                  disabled={removingId === child._id}
                  className="ml-4 text-red-500 hover:text-red-700 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove from agency"
                >
                  {removingId === child._id ? (
                    <span className="inline-block animate-spin">⏳</span>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Child Modal */}
      <AddChildModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchChildren}
      />
    </div>
  );
}