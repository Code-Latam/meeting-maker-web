// src/components/Blog/LinkedInEditModal.jsx

import React, { useState } from 'react';
import { Modal } from '../Common/Modal';

export function LinkedInEditModal({ post, onClose, onSave }) {
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
        {/* Text */}
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

        {/* Image Preview */}
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

        {/* Character count info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            💡 LinkedIn posts work best with 1,500-2,500 characters. 
            Make sure to include a hook, insight, and a question at the end.
          </p>
        </div>

        {/* Buttons */}
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