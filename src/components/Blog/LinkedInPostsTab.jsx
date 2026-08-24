// src/pages/BlogSettingsPage.jsx - LinkedInPostsTab Component

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