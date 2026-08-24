// src/pages/BlogSettingsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlogStore } from '../store/blogStore';
import { useUIStore } from '../store';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { Modal } from '../components/Common/Modal';

// ============================================================
// SETTINGS TAB COMPONENT
// ============================================================
function SettingsTab({
  blogEnabled,
  tempTitle,
  setTempTitle,
  tempLayout,
  setTempLayout,
  tempSsrCustomDomain,
  setTempSsrCustomDomain,
  tempPublishingWorkflow,
  setTempPublishingWorkflow,
  tempLinkedinWorkflow,
  setTempLinkedinWorkflow,
  postLinkedIn,
  linkedinTemplate,
  uploading,
  onToggleBlog,
  onToggleLinkedIn,
  onUploadTemplate,
  onRemoveTemplate,
  onSaveSettings,
}) {
  return (
    <div className="space-y-6">
      {/* Blog Enabled Toggle */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Blog Status</h3>
            <p className="text-sm text-gray-500">
              {blogEnabled ? 'Blog is enabled and generating content' : 'Blog is disabled'}
            </p>
          </div>
          <button
            onClick={onToggleBlog}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              blogEnabled ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                blogEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Blog Settings - KEEP Title & Layout, REMOVE Custom Domain */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">Blog Settings</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Blog Title</label>
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="My Blog"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
          <select
            value={tempLayout}
            onChange={(e) => setTempLayout(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
        </div>

        {/* ❌ REMOVED: Custom Domain (Widget) */}
      </div>

      {/* SSR Blog Settings - KEEP SSR Custom Domain, REMOVE Subdomain */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">SSR Blog (SEO Optimized)</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain</label>
          <input
            type="text"
            value={tempSsrCustomDomain}
            onChange={(e) => setTempSsrCustomDomain(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="blog.yourcompany.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Configure DNS: CNAME record → ssr-blog-renderer.vercel.app
          </p>
        </div>

        {/* ❌ REMOVED: Subdomain field */}
      </div>

      {/* Publishing Workflows */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">Publishing Workflows</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Articles</label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
              <input
                type="radio"
                name="publishingWorkflow"
                value="auto"
                checked={tempPublishingWorkflow === 'auto'}
                onChange={() => setTempPublishingWorkflow('auto')}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900 text-sm">Auto-publish</div>
                <p className="text-xs text-gray-500">Articles go live immediately when generated.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
              <input
                type="radio"
                name="publishingWorkflow"
                value="manual"
                checked={tempPublishingWorkflow === 'manual'}
                onChange={() => setTempPublishingWorkflow('manual')}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900 text-sm">Manual approval</div>
                <p className="text-xs text-gray-500">Articles saved as drafts. Review and publish.</p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Posts</label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
              <input
                type="radio"
                name="linkedinPublishingWorkflow"
                value="auto"
                checked={tempLinkedinWorkflow === 'auto'}
                onChange={() => setTempLinkedinWorkflow('auto')}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900 text-sm">Auto-publish</div>
                <p className="text-xs text-gray-500">LinkedIn posts go live immediately when generated.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
              <input
                type="radio"
                name="linkedinPublishingWorkflow"
                value="manual"
                checked={tempLinkedinWorkflow === 'manual'}
                onChange={() => setTempLinkedinWorkflow('manual')}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900 text-sm">Manual approval</div>
                <p className="text-xs text-gray-500">LinkedIn posts saved as drafts. Review and publish.</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* LinkedIn Auto-Posting */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">LinkedIn Post Generation</h3>
            <p className="text-sm text-gray-500">
              {postLinkedIn ? 'Post generation is enabled' : 'Post generation is disabled'}
            </p>
          </div>
          <button
            onClick={onToggleLinkedIn}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              postLinkedIn ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                postLinkedIn ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {postLinkedIn && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Post Template Image</label>
            <p className="text-xs text-gray-500 mb-3">
              Upload a 1200×628 pixel image for your LinkedIn posts.
            </p>

            {linkedinTemplate ? (
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img src={linkedinTemplate} alt="Template" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={onRemoveTemplate}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="template-upload"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadTemplate(file);
                  }}
                />
                <label
                  htmlFor="template-upload"
                  className="cursor-pointer text-primary-600 hover:text-primary-700"
                >
                  {uploading ? 'Uploading...' : 'Click to upload a template image'}
                </label>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG, or WebP (max 5MB)</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={onSaveSettings}
        className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
      >
        Save Settings
      </button>
    </div>
  );
}

// ============================================================
// ARTICLES TAB COMPONENT - UPDATED (No "submitted")
// ============================================================
function ArticlesTab({ articles, loading, total, page, totalPages, statusFilter, onFetch, onEdit, onPublish }) {
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);

  // Sync local filter with prop when it changes
  useEffect(() => {
    setLocalStatusFilter(statusFilter);
  }, [statusFilter]);

  const handleStatusFilter = (status) => {
    setLocalStatusFilter(status);
    onFetch(1, status);
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-700',
      published: 'bg-green-100 text-green-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  // Show loading state
  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading articles...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters - Only All, Draft, Published */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleStatusFilter('all')}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            localStatusFilter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({total})
        </button>
        <button
          onClick={() => handleStatusFilter('draft')}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            localStatusFilter === 'draft'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Draft
        </button>
        <button
          onClick={() => handleStatusFilter('published')}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            localStatusFilter === 'published'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Published
        </button>
      </div>

      {/* Empty State */}
      {articles.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-gray-500">No articles found</p>
          <p className="text-sm text-gray-400 mt-1">
            {localStatusFilter === 'draft' && 'No draft articles waiting for review.'}
            {localStatusFilter === 'published' && 'No published articles yet.'}
            {localStatusFilter === 'all' && 'Articles will appear here once generated.'}
          </p>
        </div>
      )}

      {/* Article List */}
      {articles.length > 0 && (
        <>
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
                          onClick={() => onEdit(article)}
                          className="px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => onPublish(article._id)}
                          className="px-3 py-1 text-sm text-green-600 border border-green-200 rounded-lg hover:bg-green-50"
                        >
                          🚀 Publish
                        </button>
                      </>
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
                onClick={() => onFetch(page - 1, localStatusFilter)}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => onFetch(page + 1, localStatusFilter)}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// LINKEDIN POSTS TAB COMPONENT - UPDATED (No "submitted")
// ============================================================
function LinkedInPostsTab({ posts, loading, total, page, totalPages, statusFilter, onFetch, onEdit, onPublish }) {
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);

  // Sync local filter with prop when it changes
  useEffect(() => {
    setLocalStatusFilter(statusFilter);
  }, [statusFilter]);

  const handleStatusFilter = (status) => {
    setLocalStatusFilter(status);
    onFetch(1, status);
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-700',
      posted: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  // Show loading state
  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading LinkedIn posts...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters - Only All, Draft, Posted, Failed */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleStatusFilter('all')}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            localStatusFilter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({total})
        </button>
        <button
          onClick={() => handleStatusFilter('draft')}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            localStatusFilter === 'draft'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Draft
        </button>
        <button
          onClick={() => handleStatusFilter('posted')}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            localStatusFilter === 'posted'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Posted
        </button>
        <button
          onClick={() => handleStatusFilter('failed')}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            localStatusFilter === 'failed'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Failed
        </button>
      </div>

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">🔗</div>
          <p className="text-gray-500">No LinkedIn posts found</p>
          <p className="text-sm text-gray-400 mt-1">
            {localStatusFilter === 'draft' && 'No draft LinkedIn posts waiting for review.'}
            {localStatusFilter === 'posted' && 'No published LinkedIn posts yet.'}
            {localStatusFilter === 'all' && 'LinkedIn posts will appear here once generated.'}
          </p>
        </div>
      )}

      {/* LinkedIn Posts List */}
      {posts.length > 0 && (
        <>
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
                          onClick={() => onEdit(post)}
                          className="px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => onPublish(post._id)}
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
                        onClick={() => onPublish(post._id)}
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
                onClick={() => onFetch(page - 1, localStatusFilter)}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => onFetch(page + 1, localStatusFilter)}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// ARTICLE EDIT MODAL
// ============================================================
function ArticleEditModal({ article, onClose, onSave }) {
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);
  const [excerpt, setExcerpt] = useState(article.excerpt || '');
  const [featuredImage, setFeaturedImage] = useState(article.featuredImage || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(article._id, { title, content, excerpt, featuredImage });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Article"
      maxWidth="xl"
      closeOnOutsideClick={false}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">HTML content is supported</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="Short summary of the article..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
          <input
            type="text"
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="https://example.com/image.jpg"
          />
          {featuredImage && (
            <img
              src={featuredImage}
              alt="Preview"
              className="mt-2 h-32 w-auto object-cover rounded-lg border border-gray-200"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// LINKEDIN EDIT MODAL
// ============================================================
function LinkedInEditModal({ post, onClose, onSave }) {
  const [text, setText] = useState(post.text);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert('Post text is required');
      return;
    }
    if (text.length > 3000) {
      alert('Post text exceeds 3000 character limit');
      return;
    }
    setSaving(true);
    try {
      await onSave(post._id, text);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit LinkedIn Post"
      maxWidth="lg"
      closeOnOutsideClick={false}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Post Text <span className="text-gray-400 font-normal">({text.length}/3000)</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            maxLength={3000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="Write your LinkedIn post..."
          />
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-500">{text.length} / 3000 characters</span>
            {text.length > 2800 && (
              <span className="text-yellow-600">⚠️ Getting close to limit</span>
            )}
          </div>
        </div>

        {post.imageUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image Preview</label>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-2">
              <img
                src={post.imageUrl}
                alt="LinkedIn post image"
                className="rounded-lg max-h-48 w-auto object-contain mx-auto"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Image cannot be changed</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            💡 LinkedIn posts work best with 1,500-2,500 characters. 
            Make sure to include a hook, insight, and a question at the end.
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// MAIN BLOG SETTINGS PAGE
// ============================================================
export function BlogSettingsPage() {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(true);

  // Store state
  const {
    blogEnabled,
    blogTitle,
    blogLayout,
    customDomain,
    blogType,
    ssrSubdomain,
    ssrCustomDomain,
    publishingWorkflow,
    linkedinPublishingWorkflow,
    postLinkedIn,
    linkedinTemplate,
    uploading,
    articles,
    articlesLoading,
    articlesTotal,
    articlesPage,
    articlesTotalPages,
    articlesStatusFilter,
    linkedinPosts,
    linkedinPostsLoading,
    linkedinPostsTotal,
    linkedinPostsPage,
    linkedinPostsTotalPages,
    linkedinPostsStatusFilter,
    fetchSettings,
    fetchArticles,
    fetchLinkedInPosts,
    fetchLinkedInTemplate,
    updateSettings,
    toggleBlog,
    toggleLinkedInPosting,
    uploadTemplate,
    removeTemplate,
    updateArticle,
    updateLinkedInPost,
    publishLinkedInPost,
  } = useBlogStore();

  // Local state for form inputs
  const [tempTitle, setTempTitle] = useState(blogTitle);
  const [tempLayout, setTempLayout] = useState(blogLayout);
  const [tempCustomDomain, setTempCustomDomain] = useState(customDomain);
  const [tempSsrSubdomain, setTempSsrSubdomain] = useState(ssrSubdomain);
  const [tempSsrCustomDomain, setTempSsrCustomDomain] = useState(ssrCustomDomain);
  const [tempPublishingWorkflow, setTempPublishingWorkflow] = useState(publishingWorkflow);
  const [tempLinkedinWorkflow, setTempLinkedinWorkflow] = useState(linkedinPublishingWorkflow);

  // Modal states
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [selectedLinkedInPost, setSelectedLinkedInPost] = useState(null);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchSettings(),
          fetchLinkedInTemplate(),
          fetchArticles(1, 'all'),
          fetchLinkedInPosts(1, 'all'),
        ]);
      } catch (error) {
        console.error('Failed to load blog data:', error);
        showToast('Failed to load blog data', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Update local state when store changes
  useEffect(() => {
    setTempTitle(blogTitle);
    setTempLayout(blogLayout);
    setTempCustomDomain(customDomain);
    setTempSsrSubdomain(ssrSubdomain);
    setTempSsrCustomDomain(ssrCustomDomain);
    setTempPublishingWorkflow(publishingWorkflow);
    setTempLinkedinWorkflow(linkedinPublishingWorkflow);
  }, [blogTitle, blogLayout, customDomain, ssrSubdomain, ssrCustomDomain, publishingWorkflow, linkedinPublishingWorkflow]);

  // Handle settings save
  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        title: tempTitle,
        layout: tempLayout,
        customDomain: tempCustomDomain,
        type: blogType,
        ssrSubdomain: tempSsrSubdomain,
        ssrCustomDomain: tempSsrCustomDomain,
        publishingWorkflow: tempPublishingWorkflow,
        linkedinPublishingWorkflow: tempLinkedinWorkflow,
      });
      showToast('Settings saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save settings', 'error');
    }
  };

  // Handle blog toggle
  const handleToggleBlog = async () => {
    try {
      await toggleBlog(!blogEnabled);
      showToast(`Blog ${!blogEnabled ? 'enabled' : 'disabled'} successfully`, 'success');
    } catch (error) {
      showToast('Failed to toggle blog', 'error');
    }
  };

  // Handle LinkedIn toggle
  const handleToggleLinkedIn = async () => {
    try {
      await toggleLinkedInPosting(!postLinkedIn);
      showToast(`LinkedIn posting ${!postLinkedIn ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
      showToast('Failed to toggle LinkedIn posting', 'error');
    }
  };

  // Article handlers
  const handleArticleEdit = (article) => {
    setSelectedArticle(article);
    setShowArticleModal(true);
  };

  const handleArticleSave = async (articleId, data) => {
    try {
      await updateArticle(articleId, data);
      await fetchArticles(articlesPage, articlesStatusFilter);
      setShowArticleModal(false);
      showToast('Article saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save article', 'error');
    }
  };

  const handleArticlePublish = async (articleId) => {
    if (!confirm('Publish this article?')) return;
    try {
      await updateArticle(articleId, { status: 'published', publishedAt: new Date().toISOString() });
      await fetchArticles(articlesPage, articlesStatusFilter);
      showToast('Article published successfully!', 'success');
    } catch (error) {
      showToast('Failed to publish article', 'error');
    }
  };

  // LinkedIn post handlers
  const handleLinkedInEdit = (post) => {
    setSelectedLinkedInPost(post);
    setShowLinkedInModal(true);
  };

  const handleLinkedInSave = async (postId, text) => {
    try {
      await updateLinkedInPost(postId, text);
      await fetchLinkedInPosts(linkedinPostsPage, linkedinPostsStatusFilter);
      setShowLinkedInModal(false);
      showToast('LinkedIn post updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to update LinkedIn post', 'error');
    }
  };

  const handleLinkedInPublish = async (postId) => {
    if (!confirm('Publish this LinkedIn post now?')) return;
    try {
      await publishLinkedInPost(postId);
      await fetchLinkedInPosts(linkedinPostsPage, linkedinPostsStatusFilter);
      showToast('LinkedIn post published successfully!', 'success');
    } catch (error) {
      showToast('Failed to publish LinkedIn post', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📝 Blog & Post</h1>
          <p className="text-sm text-gray-500">Manage your blog content and LinkedIn auto-posting</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Agents
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'articles'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📄 Articles ({articlesTotal})
          </button>
          <button
            onClick={() => setActiveTab('linkedin')}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'linkedin'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🔗 LinkedIn Posts ({linkedinPostsTotal})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'settings' && (
        <SettingsTab
          blogEnabled={blogEnabled}
          tempTitle={tempTitle}
          setTempTitle={setTempTitle}
          tempLayout={tempLayout}
          setTempLayout={setTempLayout}
          tempSsrCustomDomain={tempSsrCustomDomain}
          setTempSsrCustomDomain={setTempSsrCustomDomain}
          tempPublishingWorkflow={tempPublishingWorkflow}
          setTempPublishingWorkflow={setTempPublishingWorkflow}
          tempLinkedinWorkflow={tempLinkedinWorkflow}
          setTempLinkedinWorkflow={setTempLinkedinWorkflow}
          postLinkedIn={postLinkedIn}
          linkedinTemplate={linkedinTemplate}
          uploading={uploading}
          onToggleBlog={handleToggleBlog}
          onToggleLinkedIn={handleToggleLinkedIn}
          onUploadTemplate={uploadTemplate}
          onRemoveTemplate={removeTemplate}
          onSaveSettings={handleSaveSettings}
        />
      )}

      {activeTab === 'articles' && (
        <ArticlesTab
          articles={articles}
          loading={articlesLoading}
          total={articlesTotal}
          page={articlesPage}
          totalPages={articlesTotalPages}
          statusFilter={articlesStatusFilter}
          onFetch={fetchArticles}
          onEdit={handleArticleEdit}
          onPublish={handleArticlePublish}
        />
      )}

      {activeTab === 'linkedin' && (
        <LinkedInPostsTab
          posts={linkedinPosts}
          loading={linkedinPostsLoading}
          total={linkedinPostsTotal}
          page={linkedinPostsPage}
          totalPages={linkedinPostsTotalPages}
          statusFilter={linkedinPostsStatusFilter}
          onFetch={fetchLinkedInPosts}
          onEdit={handleLinkedInEdit}
          onPublish={handleLinkedInPublish}
        />
      )}

      {/* Modals */}
      {showArticleModal && selectedArticle && (
        <ArticleEditModal
          article={selectedArticle}
          onClose={() => setShowArticleModal(false)}
          onSave={handleArticleSave}
        />
      )}

      {showLinkedInModal && selectedLinkedInPost && (
        <LinkedInEditModal
          post={selectedLinkedInPost}
          onClose={() => setShowLinkedInModal(false)}
          onSave={handleLinkedInSave}
        />
      )}
    </div>
  );
}