import React, { useState } from 'react';
import { api } from '../../services/api';

export function AddChildModal({ isOpen, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [adding, setAdding] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifiedClient, setVerifiedClient] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  // Reset form
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setVerifying(false);
    setAdding(false);
    setVerified(false);
    setVerifiedClient(null);
    setError(null);
    setSuccess(null);
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Verify credentials
  const handleVerify = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setVerifying(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/auth/agency/verify-child', {
        email,
        password
      });

      if (response.data.success) {
        setVerified(true);
        setVerifiedClient(response.data);
        setSuccess(`✅ Verified: ${response.data.clientName || response.data.clientEmail}`);
        setError(null);
      }
    } catch (err) {
      console.error('Verification failed:', err);
      
      // ✅ Extract error message from response
      let errorMsg = 'Verification failed. Please check credentials.';
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      
      setError(errorMsg);
      setVerified(false);
      setVerifiedClient(null);
      setSuccess(null);
    } finally {
      setVerifying(false);
    }
  };

  // Add child
  const handleAdd = async () => {
    if (!verifiedClient) return;

    setAdding(true);
    setError(null);

    try {
      await api.post('/auth/agency/add-child', {
        childClientId: verifiedClient.clientId
      });

      setSuccess('✅ Child client added successfully!');
      setVerified(false);
      setVerifiedClient(null);
      setEmail('');
      setPassword('');
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } catch (err) {
      console.error('Failed to add child:', err);
      let errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to add child client';
      setError(errorMsg);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Add Child Client
            </h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-gray-600">
              Enter the email and password of the client you want to add to your agency.
              We'll verify the credentials before adding.
            </p>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={verified || adding}
                placeholder="client@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-100"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={verified || adding}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-100"
              />
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Verified Client Info */}
            {verified && verifiedClient && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800">Verified Client:</p>
                <div className="mt-1 space-y-0.5 text-sm text-blue-700">
                  <p><strong>Name:</strong> {verifiedClient.clientName || 'N/A'}</p>
                  <p><strong>Email:</strong> {verifiedClient.clientEmail}</p>
                  <p><strong>Plan:</strong> {verifiedClient.plan || 'Free'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={adding}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            {!verified ? (
              <button
                onClick={handleVerify}
                disabled={verifying || adding}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {verifying ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>Verify</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleAdd}
                disabled={adding}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {adding ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>Add Client</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}