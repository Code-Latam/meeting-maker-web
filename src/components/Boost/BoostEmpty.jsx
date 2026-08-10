import React, { useState } from 'react';
import { useBoostStore } from '../../store/boostStore';
import { useUIStore } from '../../store';

export function BoostEmpty() {
  const { submitPost, isSubmitting } = useBoostStore();
  const { showToast } = useUIStore();
  
  const [postUrl, setPostUrl] = useState('');
  const [isOwnPost, setIsOwnPost] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!postUrl.trim()) {
      showToast('Please enter a LinkedIn post URL', 'error');
      return;
    }
    
    // Validate URL format - only accept feed/update URN format
    const urnMatch = postUrl.match(/urn:li:activity:(\d+)/);
    if (!urnMatch) {
      showToast('Please use the feed/update URL format: https://www.linkedin.com/feed/update/urn:li:activity:XXXXXXXXXX/', 'error');
      return;
    }
    
    if (!postUrl.includes('linkedin.com/feed/update/')) {
      showToast('Please use the feed/update URL from LinkedIn', 'error');
      return;
    }
    
    const result = await submitPost(postUrl.trim(), isOwnPost);
    if (result.success) {
      showToast('✅ Post submitted successfully! Status: Pending', 'success');
      setPostUrl('');
      setIsOwnPost(false);
    } else {
      showToast(result.error || 'Failed to submit post', 'error');
    }
  };

  return (
    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn Post URL
          </label>
          <input
            type="text"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            placeholder="https://www.linkedin.com/feed/update/urn:li:activity:XXXXXXXXXX/"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
          <input
            type="checkbox"
            id="isOwnPost"
            checked={isOwnPost}
            onChange={(e) => setIsOwnPost(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            disabled={isSubmitting}
          />
          <label htmlFor="isOwnPost" className="text-sm font-medium text-gray-700 cursor-pointer">
            This is my own LinkedIn post
          </label>
        </div>
        
        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 btn-primary"
          >
            {isSubmitting ? '⏳ Submitting...' : 'Submit Post'}
          </button>
          <button
            type="button"
            onClick={() => { setPostUrl(''); setIsOwnPost(false); }}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Clear
          </button>
        </div>
        
        <p className="text-xs text-gray-500">
          💡 Paste a LinkedIn post URL to boost it through our network
        </p>
      </form>
    </div>
  );
}