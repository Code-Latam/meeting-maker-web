// src/components/Blog/ArticlesTab.jsx

import React, { useState } from 'react';
import { useBlogStore } from '../../store/blogStore';
import { useUIStore } from '../../store';
import { ArticleEditModal } from './ArticleEditModal';

export function ArticlesTab({ articles, loading, total, page, totalPages, statusFilter, onFetch }) {
  const { showToast } = useUIStore();
  const { updateArticle, submitArticle } = useBlogStore();
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleStatusFilter = (status) => {
    onFetch(1, status);
  };

  const handleEdit = (article) => {
    setSelectedArticle(article);
    setShowEditModal(true);
  };

  const handleSave = async (articleId, data) => {
    try {
      await updateArticle(articleId, data);
      await onFetch(page, statusFilter);
      setShowEditModal(false);
      showToast('Article saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save article', 'error');
    }
  };

  const handleSubmit = async (articleId) => {
    if (!confirm('Submit this article for publishing?')) return;
    try {
      await submitArticle(articleId);
      await onFetch(page, statusFilter);
      showToast('Article submitted for publishing!', 'success');
    } catch (error) {
      showToast('Failed to submit article', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-700',
      submitted: 'bg-blue-100 text-blue-700',
      published: 'bg-green-100 text-green-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading articles...</div>;
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-4xl mb-3">📄</div>
        <p className="text-gray-500">No articles found</p>
        <p className="text-sm text-gray-400 mt-1">
          {statusFilter === 'draft' && 'No draft articles waiting for review.'}
          {statusFilter === 'submitted' && 'No articles pending publishing.'}
          {statusFilter === 'published' && 'No published articles yet.'}
          {statusFilter === 'all' && 'Articles will appear here once generated.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'draft', 'submitted', 'published'].map((status) => (
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

        {/* Article List */}
        <div className="space-y-3">
          {articles.map((article) => (
            <div key={article._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-gray-900 truncate">{article.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(article.status)}`}>
                      {article.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>📖 {article.readTime} min read</span>
                    {article.publishedAt && (
                      <span>📅 {new Date(article.publishedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  {article.status === 'draft' && (
                    <>
                      <button
                        onClick={() => handleEdit(article)}
                        className="px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleSubmit(article._id)}
                        className="px-3 py-1 text-sm text-green-600 border border-green-200 rounded-lg hover:bg-green-50"
                      >
                        📤 Submit
                      </button>
                    </>
                  )}
                  {article.status === 'submitted' && (
                    <span className="text-sm text-gray-400 px-3 py-1">⏳ Pending...</span>
                  )}
                  {article.status === 'published' && (
                    <span className="text-sm text-green-600 px-3 py-1">✅ Published</span>
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
      {showEditModal && selectedArticle && (
        <ArticleEditModal
          article={selectedArticle}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}