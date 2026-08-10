import React from 'react';
import { useBoostStore } from '../../store/boostStore';
import { useUIStore } from '../../store';

export function BoostStatus() {
  const { post, deletePost, refreshStatus, isLoading } = useBoostStore();
  const { showToast } = useUIStore();

  if (!post) return null;

  const handleDelete = async () => {
    if (!confirm('Delete this boosted post?')) return;
    const result = await deletePost(post.id);
    if (result.success) {
      showToast('🗑️ Post deleted successfully', 'success');
    } else {
      showToast(result.error || 'Failed to delete post', 'error');
    }
  };

  const handleRefresh = async () => {
    const result = await refreshStatus(post.id);
    if (result.success) {
      showToast('🔄 Status updated', 'success');
    } else {
      showToast(result.error || 'Failed to refresh status', 'error');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: '⏳ Pending', className: 'bg-yellow-100 text-yellow-700' },
      'boosted': { label: '✅ Boosted', className: 'bg-green-100 text-green-700' },
      'failed': { label: '❌ Failed', className: 'bg-red-100 text-red-700' }
    };
    const s = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return s;
  };

  const statusInfo = getStatusBadge(post.status);
  
  // Check if post can be deleted
  const isToday = new Date(post.createdAt).toDateString() === new Date().toDateString();
  const canDelete = post.status === 'pending' || (post.status === 'boosted' && !isToday);
  
  // Get hint text based on status
  const getHintText = () => {
    if (post.status === 'pending') {
      return {
        text: '⏳ Your post is pending. You can delete it and submit a new one.',
        className: 'text-yellow-700'
      };
    } else if (post.status === 'boosted') {
      return {
        text: '✅ Your post has been boosted! Check back tomorrow to submit another.',
        className: 'text-green-700'
      };
    } else if (post.status === 'failed') {
      return {
        text: '❌ Your post failed to boost. Delete it and try again with a valid URL.',
        className: 'text-red-700'
      };
    }
    return { text: '', className: '' };
  };

  const hint = getHintText();

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 mb-1">Current Post:</p>
          <div className="bg-white p-3 rounded-lg border border-gray-200 break-all text-sm text-gray-600">
            {post.url}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            📌 Own post: {post.isOwnPost ? 'Yes' : 'No'}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleDelete}
          disabled={!canDelete || isLoading}
          className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            canDelete && !isLoading
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title={!canDelete ? 'Cannot delete a post that has already been boosted today' : ''}
        >
          🗑️ Delete Post
        </button>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔄 Refresh Status
        </button>
      </div>

      {/* Status details */}
      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500">
          <span>Created: {new Date(post.createdAt).toLocaleString()}</span>
          {post.boostedAt && (
            <span>Boosted: {new Date(post.boostedAt).toLocaleString()}</span>
          )}
          {post.failedAt && (
            <span>Failed: {new Date(post.failedAt).toLocaleString()}</span>
          )}
        </div>
        {post.failureReason && (
          <div className="mt-2 text-xs text-red-600">
            Reason: {post.failureReason}
          </div>
        )}
      </div>

      {/* Hint text */}
      {hint.text && (
        <p className={`mt-3 text-sm ${hint.className}`}>
          {hint.text}
        </p>
      )}
    </div>
  );
}