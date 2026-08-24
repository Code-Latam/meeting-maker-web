// src/pages/BlogSettingsPage.jsx - ArticlesTab Component

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