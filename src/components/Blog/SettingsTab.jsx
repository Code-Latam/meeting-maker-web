// src/components/Blog/SettingsTab.jsx

import React from 'react';

export function SettingsTab({
  blogEnabled,
  blogType,
  tempTitle,
  setTempTitle,
  tempLayout,
  setTempLayout,
  tempCustomDomain,
  setTempCustomDomain,
  tempSsrSubdomain,
  setTempSsrSubdomain,
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

      {/* Blog Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">Blog Settings</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Blog Title</label>
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="My Blog"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
          <select
            value={tempLayout}
            onChange={(e) => setTempLayout(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain (Widget)</label>
          <input
            type="text"
            value={tempCustomDomain}
            onChange={(e) => setTempCustomDomain(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="yourwebsite.com"
          />
          <p className="text-xs text-gray-500 mt-1">Where your widget is embedded. Leave empty for main site.</p>
        </div>
      </div>

      {/* SSR Blog Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">SSR Blog (SEO Optimized)</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tempSsrSubdomain}
              onChange={(e) => setTempSsrSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="yourbrand"
            />
            <span className="text-gray-500 text-sm">.meetingmaker.tech</span>
          </div>
          {tempSsrSubdomain && (
            <p className="text-xs text-green-600 mt-1">
              ✅ Available at: https://{tempSsrSubdomain}.meetingmaker.tech
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain (Optional)</label>
          <input
            type="text"
            value={tempSsrCustomDomain}
            onChange={(e) => setTempSsrCustomDomain(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="blog.yourcompany.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Configure DNS: CNAME record → ssr-blog-renderer.vercel.app
          </p>
        </div>
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
                <p className="text-xs text-gray-500">Articles saved as drafts. Review and submit.</p>
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
                <p className="text-xs text-gray-500">LinkedIn posts saved as drafts. Review and submit.</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* LinkedIn Auto-Posting */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">LinkedIn Auto-Posting</h3>
            <p className="text-sm text-gray-500">
              {postLinkedIn ? 'Auto-posting is enabled' : 'Auto-posting is disabled'}
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