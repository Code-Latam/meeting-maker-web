import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../store/agentStore';
import { useUIStore } from '../../store';
import { WebsiteModal } from './WebsiteModal';

export function AgentForm({ agent, onClose, onSuccess }) {
  const { createAgent, updateAgent, categories, fetchCategories } = useAgentStore();
  const { showToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);
  const [isGeneratingServices, setIsGeneratingServices] = useState(false);
  const [websiteData, setWebsiteData] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    persona: '',
    isActive: true,
    tone: 'professional',
    maxFollowUps: 3,
    followUpDays: 2,
    emailSignature: '',
    primaryGoal: {
      type: '',
      label: '',
      fulfillmentLink: ''
    },
    services: [],
    dos: [],
    donts: [],
    fallbackGoals: [],
    channelLimits: [{ channel: 'linkedIn', maxConnectionsPerDay: 0, maxMessagesPerDay: 0 }]
  });

  // Load website data from localStorage on mount
  useEffect(() => {
    const savedWebsiteData = localStorage.getItem('agentWebsiteData');
    if (savedWebsiteData) {
      try {
        const parsed = JSON.parse(savedWebsiteData);
        setWebsiteData(parsed);
      } catch (e) {
        console.error('Error loading website data:', e);
      }
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    if (agent) {
      setFormData({
        name: agent.name || '',
        role: agent.role || '',
        persona: agent.persona || '',
        isActive: agent.isActive !== undefined ? agent.isActive : true,
        tone: agent.tone || 'professional',
        maxFollowUps: agent.maxFollowUps || 3,
        followUpDays: agent.followUpDays || 2,
        emailSignature: agent.emailSignature || '',
        primaryGoal: agent.primaryGoal || { type: '', label: '', fulfillmentLink: '' },
        services: agent.services || [],
        dos: agent.dos || [],
        donts: agent.donts || [],
        fallbackGoals: agent.fallbackGoals || [],
        channelLimits: agent.channelLimits || [{ channel: 'linkedIn', maxConnectionsPerDay: 0, maxMessagesPerDay: 0 }]
      });
    }
  }, [agent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast('Agent name is required', 'error');
      return;
    }
    if (!formData.role) {
      showToast('Please select a role', 'error');
      return;
    }
    if (!formData.persona.trim()) {
      showToast('Persona is required', 'error');
      return;
    }

    setIsLoading(true);
    const result = agent 
      ? await updateAgent(agent._id, formData)
      : await createAgent(formData);

    if (result.success) {
      showToast(agent ? 'Agent updated successfully' : 'Agent created successfully', 'success');
      onSuccess?.();
      onClose();
    } else {
      showToast(result.error || 'Failed to save agent', 'error');
    }
    setIsLoading(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrimaryGoalChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      primaryGoal: { ...prev.primaryGoal, [field]: value }
    }));
  };

  const addStringField = (field, value = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value]
    }));
  };

  const removeStringField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const setStringField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: [value]
    }));
  };

  const addChannelLimit = () => {
    setFormData(prev => ({
      ...prev,
      channelLimits: [
        ...prev.channelLimits,
        { channel: 'linkedIn', maxConnectionsPerDay: 0, maxMessagesPerDay: 0 }
      ]
    }));
  };

  const removeChannelLimit = (index) => {
    setFormData(prev => ({
      ...prev,
      channelLimits: prev.channelLimits.filter((_, i) => i !== index)
    }));
  };

  const updateChannelLimit = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      channelLimits: prev.channelLimits.map((cl, i) =>
        i === index ? { ...cl, [field]: value } : cl
      )
    }));
  };

  // Handle website data from modal
  const handleWebsiteDataSaved = (data) => {
    setWebsiteData(data);
    localStorage.setItem('agentWebsiteData', JSON.stringify(data));
    showToast('✅ Website data saved!', 'success');
  };

  // Generate Persona
  const handleGeneratePersona = async () => {
    if (!formData.role) {
      showToast('Please select a role first', 'error');
      return;
    }

    // Check if we have website data
    if (!websiteData) {
      showToast('Please fetch website information first', 'info');
      setIsWebsiteModalOpen(true);
      return;
    }

    setIsGeneratingPersona(true);
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch('https://api.meetingmaker.tech/agents/generate-persona', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: formData.role,
          websiteData: websiteData.data || websiteData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate persona');
      }

      if (data.success && data.persona) {
        handleChange('persona', data.persona);
        showToast('✅ Persona generated successfully!', 'success');
      } else {
        throw new Error(data.message || 'Failed to generate persona');
      }
    } catch (err) {
      console.error('Error generating persona:', err);
      showToast(err.message || 'Failed to generate persona', 'error');
    } finally {
      setIsGeneratingPersona(false);
    }
  };

  // Generate Services - Now creates ONE service entry
  const handleGenerateServices = async () => {
    // Check if we have website data
    if (!websiteData) {
      showToast('Please fetch website information first', 'info');
      setIsWebsiteModalOpen(true);
      return;
    }

    setIsGeneratingServices(true);
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch('https://api.meetingmaker.tech/agents/generate-services', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          websiteData: websiteData.data || websiteData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate services');
      }

      if (data.success && data.services) {
        // Clear existing services and add ONE service entry
        const servicesText = data.services;
        // Store as a single service entry
        setStringField('services', servicesText);
        showToast('✅ Services generated successfully!', 'success');
      } else {
        throw new Error(data.message || 'Failed to generate services');
      }
    } catch (err) {
      console.error('Error generating services:', err);
      showToast(err.message || 'Failed to generate services', 'error');
    } finally {
      setIsGeneratingServices(false);
    }
  };

  const handleOpenWebsiteModal = () => {
    setIsWebsiteModalOpen(true);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Agent Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="e.g., John's SDR Agent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            required
          >
            <option value="">Select a role</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Generation Buttons */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGeneratePersona}
              disabled={isGeneratingPersona}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isGeneratingPersona ? '⏳ Generating...' : '🤖 Generate Persona'}
            </button>
            <button
              type="button"
              onClick={handleGenerateServices}
              disabled={isGeneratingServices}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isGeneratingServices ? '⏳ Generating...' : '📋 Generate Services'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleOpenWebsiteModal}
              className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              🌐 Fetch Website Info
            </button>
            {websiteData && (
              <span className="text-xs text-green-600">
                ✅ Website data saved
              </span>
            )}
          </div>
          <small className="block text-gray-500 text-xs">
            Generate content using stored website data. Click "Fetch Website Info" to add or update website data.
          </small>
        </div>

        {/* Persona - Moved up */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Persona *
          </label>
          <textarea
            value={formData.persona}
            onChange={(e) => handleChange('persona', e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
            placeholder="Describe the agent's persona, expertise, and approach..."
            required
          />
        </div>

        {/* Services - Moved up after Persona */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Services</label>
            <button
              type="button"
              onClick={() => addStringField('services', '')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              + Add Service
            </button>
          </div>
          {formData.services.map((service, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <textarea
                value={service}
                onChange={(e) => {
                  const newServices = [...formData.services];
                  newServices[index] = e.target.value;
                  handleChange('services', newServices);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
                rows={2}
                placeholder="Describe a service..."
              />
              <button
                type="button"
                onClick={() => removeStringField('services', index)}
                className="px-3 text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
          {formData.services.length === 0 && (
            <p className="text-sm text-gray-400">No services added yet. Click "+ Add Service" or use "Generate Services".</p>
          )}
        </div>

        {/* Active toggle */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            Active
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tone
          </label>
          <select
            value={formData.tone}
            onChange={(e) => handleChange('tone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="direct">Direct</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary Goal Type *
          </label>
          <select
            value={formData.primaryGoal.type}
            onChange={(e) => handlePrimaryGoalChange('type', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            required
          >
            <option value="">Select goal type</option>
            <option value="book_meeting">Book Meeting</option>
            <option value="email_reply">Email Reply</option>
            <option value="subscription">Subscription</option>
            <option value="follow_me">Follow Me</option>
            <option value="send_dm">Send DM</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary Goal Label *
          </label>
          <input
            type="text"
            value={formData.primaryGoal.label}
            onChange={(e) => handlePrimaryGoalChange('label', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="e.g., Schedule a discovery call"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fulfillment Link
          </label>
          <input
            type="url"
            value={formData.primaryGoal.fulfillmentLink}
            onChange={(e) => handlePrimaryGoalChange('fulfillmentLink', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="https://calendly.com/..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Signature
          </label>
          <textarea
            value={formData.emailSignature}
            onChange={(e) => handleChange('emailSignature', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
            placeholder="Best regards,&#10;John Doe&#10;Founder, Company Name&#10;https://www.yourdomain.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            This signature will be appended to all emails sent by this agent.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Follow-Ups
          </label>
          <input
            type="number"
            value={formData.maxFollowUps}
            onChange={(e) => handleChange('maxFollowUps', parseInt(e.target.value) || 0)}
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Number of follow-up messages after the initial contact.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Follow-Up Delay (Days)
          </label>
          <input
            type="number"
            value={formData.followUpDays}
            onChange={(e) => handleChange('followUpDays', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Days to wait before sending a follow-up when no reply.
          </p>
        </div>

        {/* Channel Limits */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Channel Limits</label>
            <button
              type="button"
              onClick={addChannelLimit}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              + Add
            </button>
          </div>
          {formData.channelLimits.map((limit, index) => (
            <div key={index} className="flex gap-2 mb-2 items-center">
              <select
                value={limit.channel}
                onChange={(e) => updateChannelLimit(index, 'channel', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="linkedIn">LinkedIn</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
              <input
                type="number"
                value={limit.maxConnectionsPerDay}
                onChange={(e) => updateChannelLimit(index, 'maxConnectionsPerDay', parseInt(e.target.value) || 0)}
                min="0"
                placeholder="Max Conn."
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <input
                type="number"
                value={limit.maxMessagesPerDay}
                onChange={(e) => updateChannelLimit(index, 'maxMessagesPerDay', parseInt(e.target.value) || 0)}
                min="0"
                placeholder="Max Msg."
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => removeChannelLimit(index)}
                className="px-3 text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 btn-primary"
          >
            {isLoading ? 'Saving...' : (agent ? 'Update Agent' : 'Create Agent')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Website Modal */}
      <WebsiteModal
        isOpen={isWebsiteModalOpen}
        onClose={() => setIsWebsiteModalOpen(false)}
        onSave={handleWebsiteDataSaved}
        existingData={websiteData}
      />
    </>
  );
}