// src/pages/TemplatesPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { Modal } from '../components/Common/Modal';

export function TemplatesPage() {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    template: '',
    isDefault: false
  });
  const [saving, setSaving] = useState(false);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      showToast('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.template) {
      showToast('Name and template are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/templates', formData);
      showToast('Template created successfully', 'success');
      setIsModalOpen(false);
      resetForm();
      await loadTemplates();
    } catch (error) {
      console.error('Failed to create template:', error);
      showToast(error.response?.data?.error || 'Failed to create template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.template) {
      showToast('Name and template are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/templates/${editingTemplate._id}`, formData);
      showToast('Template updated successfully', 'success');
      setIsModalOpen(false);
      resetForm();
      await loadTemplates();
    } catch (error) {
      console.error('Failed to update template:', error);
      showToast(error.response?.data?.error || 'Failed to update template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template) => {
    if (!confirm(`Delete template "${template.name}"? This cannot be undone.`)) return;
    
    try {
      await api.delete(`/templates/${template._id}`);
      showToast('Template deleted', 'success');
      await loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      showToast('Failed to delete template', 'error');
    }
  };

  const handleSetDefault = async (template) => {
    try {
      await api.put(`/templates/${template._id}/default`);
      showToast(`${template.name} set as default`, 'success');
      await loadTemplates();
    } catch (error) {
      console.error('Failed to set default:', error);
      showToast('Failed to set default', 'error');
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      template: template.template,
      isDefault: template.isDefault || false
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      template: '',
      isDefault: false
    });
    setEditingTemplate(null);
  };

  // Extract variables from template
  const extractVariables = (template) => {
    const matches = template.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    return matches.map(m => m.replace(/\{\{|\}\}/g, ''));
  };

  // Preview template with sample data
  const previewTemplate = (template) => {
    const sampleData = {
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      company: 'Acme Corp',
      title: 'VP of Sales',
      industry: 'Technology',
      location: 'San Francisco'
    };

    let preview = template;
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return preview;
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
          <h1 className="text-2xl font-bold text-gray-900">📝 Message Templates</h1>
          <p className="text-sm text-gray-500">
            Create and manage message templates for your campaigns. Templates can be used across all agents and campaigns.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
      </div>

      {/* Action Button */}
      <div className="mb-6">
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + New Template
        </button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-gray-500">No templates yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first message template to use in campaigns.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            + Create Template
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => {
            const variables = extractVariables(template.template);
            const preview = previewTemplate(template.template);
            const isUsed = template.usageCount > 0;

            return (
              <div key={template._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      {template.isDefault && (
                        <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">Default</span>
                      )}
                      {!template.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                      {isUsed && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          Used in {template.usageCount} campaign{template.usageCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Template preview */}
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Template:</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{template.template}</div>
                    </div>

                    {/* Variables and preview */}
                    {variables.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500">Variables:</span>
                        {variables.map((v, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Preview with sample data */}
                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                      <div className="text-xs text-green-600 mb-1">Preview:</div>
                      <div className="text-sm text-gray-700">{preview}</div>
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                      Created: {new Date(template.createdAt).toLocaleDateString()}
                      {template.lastUsedAt && ` · Last used: ${new Date(template.lastUsedAt).toLocaleDateString()}`}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    {!template.isDefault && (
                      <button
                        onClick={() => handleSetDefault(template)}
                        className="px-3 py-1 text-sm text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                      >
                        ⭐ Set Default
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(template)}
                      className="px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={editingTemplate ? 'Edit Template' : 'Create Template'}
        maxWidth="lg"
        closeOnOutsideClick={false}
      >
        <form onSubmit={editingTemplate ? handleUpdate : handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="e.g., Cold Outreach - SaaS"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Template *
            </label>
            <textarea
              value={formData.template}
              onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-mono text-sm"
              placeholder="Hi {{firstName}}, I noticed you're at {{company}}..."
              required
            />
            <div className="mt-2">
              <span className="text-xs text-gray-500">Available variables:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {['firstName', 'lastName', 'fullName', 'company', 'title', 'industry', 'location'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      const textarea = document.querySelector('textarea');
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newText = formData.template.substring(0, start) + `{{${v}}}` + formData.template.substring(end);
                        setFormData({ ...formData, template: newText });
                        setTimeout(() => {
                          textarea.focus();
                          textarea.selectionStart = start + v.length + 4;
                          textarea.selectionEnd = start + v.length + 4;
                        }, 10);
                      }
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded transition-colors"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Click a variable to insert it at the cursor position.
            </p>
          </div>

          {formData.template && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs text-green-600 font-medium mb-1">Preview with sample data:</div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {previewTemplate(formData.template)}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isDefault" className="text-sm text-gray-700">
              Set as default template
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
            >
              {saving ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Create Template')}
            </button>
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}