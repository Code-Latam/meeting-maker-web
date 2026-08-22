// src/components/Blog/LinkedInPostsTab.jsx

import React, { useState } from 'react';
import { useBlogStore } from '../../store/blogStore';
import { useUIStore } from '../../store';
import { LinkedInEditModal } from './LinkedInEditModal';

export function LinkedInPostsTab({ posts, loading, total, page, totalPages, statusFilter, onFetch }) {
  const { showToast } = useUIStore();
  const { updateLinkedInPost, submitLinkedInPost, publishLinkedInPost } = useBlogStore();
  const [selectedPost, setSelectedPost] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleStatusFilter = (status) => {
    onFetch(1, status);
  };

  const handleEdit = (post) => {
    setSelectedPost(post);
    setShowEditModal(true);
  };

  const handleSave = async (postId, text) => {
    try {
      await updateLinkedInPost(postId, text);
      await onFetch(page, statusFilter);
      setShowEditModal(false);
      showToast('LinkedIn post updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to update LinkedIn post', 'error');
    }
  };

  const handleSubmit = async (postId) => {
    if (!confirm('Submit this LinkedIn post for publishing?')) return;
    try {
      await submitLinkedInPost(postId);
      await onFetch(page, statusFilter);
      showToast('LinkedIn post submitted for publishing!', 'success');
    } catch (error) {
      showToast('Failed to submit LinkedIn post', 'error');
    }
  };

  const handlePublish = async (postId) => {
    if (!confirm('Publish this LinkedIn post now?')) return;
    try {
      await publishLinkedInPost(postId);
      await onFetch(page, statusFilter);
      showToast('LinkedIn post published successfully!', 'success');
    } catch (error) {
      showToast('Failed to publish LinkedIn post', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-700',
      submitted: 'bg-blue-100 text-blue-700',
      posted: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading LinkedIn posts...</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-4xl mb-3">🔗</div>
        <p className="text-gray-500">No LinkedIn posts found</p>
        <p className="text-sm text-gray-400 mt-1">
          {statusFilter === 'draft' && 'No draft LinkedIn posts waiting for review.'}
          {statusFilter === 'submitted' && 'No LinkedIn posts pending publishing.'}
          {statusFilter === 'posted' && 'No published LinkedIn posts yet.'}
          {statusFilter === 'all' && 'LinkedIn posts will appear here once generated.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'draft', 'submitted', 'posted', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'all' && ` (${total})`}
            </button>
          ))}
        </div>

        {/* LinkedIn Posts List */}
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Image Thumbnail */}
                {post.imageUrl && (
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={post.imageUrl}
                      alt="Post image"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {post.text.substring(0, 100)}...
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(post.status)}`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.text}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>📅 Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                    {post.postedAt && (
                      <span className="text-green-600">📤 Posted: {new Date(post.postedAt).toLocaleDateString()}</span>
                    )}
                    {post.error && (
                      <span className="text-red-600">❌ Error: {post.error}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  {post.status === 'draft' && (
                    <>
                      <button
                        onClick={() => handleEdit(post)}
                        className="px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleSubmit(post._id)}
                        className="px-3 py-1 text-sm text-green-600 border border-green-200 rounded-lg hover:bg-green-50"
                      >
                        📤 Submit
                      </button>
                      <button
                        onClick={() => handlePublish(post._id)}
                        className="px-3 py-1 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50"
                      >
                        🚀 Publish Now
                      </button>
                    </>
                  )}
                  {post.status === 'submitted' && (
                    <>
                      <span className="text-sm text-gray-400 px-3 py-1">⏳ Pending...</span>
                      <button
                        onClick={() => handlePublish(post._id)}
                        className="px-3 py-1 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50"
                      >
                        🚀 Publish Now
                      </button>
                    </>
                  )}
                  {post.status === 'posted' && post.postUrl && (
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm text-cyan-600 border border-cyan-200 rounded-lg hover:bg-cyan-50"
                    >
                      👁️ View
                    </a>
                  )}
                  {post.status === 'failed' && (
                    <button
                      onClick={() => handlePublish(post._id)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      🔄 Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onFetch(page - 1, statusFilter)}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onFetch(page + 1, statusFilter)}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedPost && (
        <LinkedInEditModal
          post={selectedPost}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}