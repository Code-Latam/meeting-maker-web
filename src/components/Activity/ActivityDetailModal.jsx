import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../Common/Modal';
import { useUIStore } from '../../store';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { crmService } from '../../services/crm';
import { agentsService } from '../../services/agents';

// Helper to format thread info
const formatThreadInfo = (thread) => {
  if (!thread) return 'No thread found';
  const stats = thread.stats || {};
  return (
    <div className="space-y-1 text-xs">
      <div><span className="text-gray-500">Stage:</span> <span className="font-medium">{thread.stage || 'prospecting'}</span></div>
      <div><span className="text-gray-500">Messages:</span> {stats.inboundCount || 0} inbound, {stats.outboundCount || 0} outbound</div>
      <div><span className="text-gray-500">Last message:</span> {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleString() : 'Never'}</div>
      <div><span className="text-gray-500">Lifecycle:</span> <span className={`font-medium ${
        thread.lifecycle?.state === 'open' ? 'text-green-600' :
        thread.lifecycle?.state === 'converted' ? 'text-blue-600' :
        thread.lifecycle?.state === 'paused' ? 'text-yellow-600' :
        thread.lifecycle?.state === 'do_not_contact' ? 'text-red-600' :
        thread.lifecycle?.state === 'archived' ? 'text-gray-400' :
        'text-gray-600'
      }`}>{thread.lifecycle?.state || 'open'}</span></div>
      {thread.lifecycle?.reason && (
        <div><span className="text-gray-500">Reason:</span> {thread.lifecycle.reason}</div>
      )}
    </div>
  );
};

export function ActivityDetailModal({ isOpen, activity, onClose }) {
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [person, setPerson] = useState(null);
  const [deals, setDeals] = useState([]);
  const [agents, setAgents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [dealTypes, setDealTypes] = useState([]);

  // Form states
  const [personType, setPersonType] = useState('prospect');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [channelPreference, setChannelPreference] = useState('linkedin');
  const [emailAddress, setEmailAddress] = useState('');

  // Lifecycle states
  const [linkedinState, setLinkedinState] = useState('open');
  const [linkedinReason, setLinkedinReason] = useState('');
  const [linkedinThreadInfo, setLinkedinThreadInfo] = useState(null);
  const [emailState, setEmailState] = useState('');
  const [emailReason, setEmailReason] = useState('');
  const [emailThreadInfo, setEmailThreadInfo] = useState(null);

  // Deal form
  const [showDealForm, setShowDealForm] = useState(false);
  const [dealForm, setDealForm] = useState({
    name: '',
    size: '',
    stage: 'lead',
    dealType: '',
    description: '',
    expectedCloseDate: '',
    probability: 10
  });
  const [editingDealId, setEditingDealId] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('mm');

  // Load person data
  const loadPersonData = useCallback(async () => {
    if (!activity) return;

    setLoading(true);
    try {
      // Get person details
      const personResult = await crmService.getPerson(activity.personId);
      if (personResult.success && personResult.person) {
        const p = personResult.person;
        setPerson(p);
        setPersonType(p.personType || 'prospect');
        setAssignedAgentId(p.assignedAgentId || '');
        setGroupId(p.groupId || '');
        setChannelPreference(p.channelPreference || 'linkedin');

        // Get email from channels
        const emailChannel = p.channels?.find(c => c.type === 'email');
        setEmailAddress(emailChannel?.identifiers?.email || '');

        // Get LinkedIn thread info
        const linkedinThread = p.threads?.find(t => t.channel === 'linkedin');
        if (linkedinThread) {
          setLinkedinThreadInfo(linkedinThread);
          setLinkedinState(linkedinThread.lifecycle?.state || 'open');
          setLinkedinReason(linkedinThread.lifecycle?.reason || '');
        } else {
          setLinkedinThreadInfo(null);
        }

        // Get Email thread info
        const emailThread = p.threads?.find(t => t.channel === 'email');
        if (emailThread) {
          setEmailThreadInfo(emailThread);
          setEmailState(emailThread.lifecycle?.state || '');
          setEmailReason(emailThread.lifecycle?.reason || '');
        } else {
          setEmailThreadInfo(null);
        }
      }

      // Get agents
      const agentsResult = await agentsService.getAgents();
      if (agentsResult.success) {
        setAgents(agentsResult.agents || []);
      }

      // Get groups
      if (personResult.success && personResult.person?.assignedAgentId) {
        const groupsResult = await crmService.getGroups(personResult.person.assignedAgentId);
        if (groupsResult.success) {
          setGroups(groupsResult.groups || []);
        }
      }

      // Get deal types
      const typesResult = await crmService.getDealTypes();
      if (typesResult.success) {
        setDealTypes(typesResult.types || []);
      }

      // Get deals for this person
      if (activity.personId) {
        const dealsResult = await crmService.getDealsForPerson(activity.personId);
        if (dealsResult.success) {
          setDeals(dealsResult.deals || []);
        }
      }

    } catch (error) {
      console.error('Error loading person data:', error);
      showToast('Failed to load person details', 'error');
    } finally {
      setLoading(false);
    }
  }, [activity, showToast]);

  useEffect(() => {
    if (isOpen && activity) {
      loadPersonData();
    }
  }, [isOpen, activity]);

  // Handle applying changes
  const handleApplyChanges = async () => {
    if (!person) return;

    setSaving(true);
    try {
      // 1. Update person
      const updates = {
        personType,
        assignedAgentId: assignedAgentId || null,
        groupId: groupId || null,
        channelPreference
      };

      const updateResult = await crmService.updatePerson(activity.personId, updates);
      if (!updateResult.success) {
        showToast(updateResult.error || 'Failed to update person', 'error');
        setSaving(false);
        return;
      }
      setPerson(updateResult.person);

      // 2. Update LinkedIn lifecycle
      if (linkedinState) {
        const lifecycleResult = await crmService.updateLifecycleState(
          activity.personId,
          'linkedin',
          linkedinState,
          linkedinReason || 'manual_update'
        );
        if (!lifecycleResult.success) {
          showToast(lifecycleResult.error || 'Failed to update LinkedIn lifecycle', 'error');
          setSaving(false);
          return;
        }
        if (lifecycleResult.person) {
          const updatedLinkedinThread = lifecycleResult.person.threads?.find(t => t.channel === 'linkedin');
          if (updatedLinkedinThread) {
            setLinkedinThreadInfo(updatedLinkedinThread);
          }
        }
      }

      // 3. Update email channel if changed
      const currentEmail = person.channels?.find(c => c.type === 'email')?.identifiers?.email || '';
      if (emailAddress !== currentEmail) {
        const emailResult = await crmService.updateEmailChannel(activity.personId, emailAddress);
        if (!emailResult.success) {
          showToast(emailResult.error || 'Failed to update email', 'error');
          setSaving(false);
          return;
        }
        if (emailResult.person) {
          setPerson(emailResult.person);
        }
      }

      // 4. Update email lifecycle if state changed
      const currentEmailState = emailThreadInfo?.lifecycle?.state || '';
      if (emailState && emailState !== currentEmailState) {
        const emailLifecycleResult = await crmService.updateEmailLifecycle(
          activity.personId,
          emailState,
          emailReason || 'manual_update'
        );
        if (!emailLifecycleResult.success) {
          showToast(emailLifecycleResult.error || 'Failed to update email lifecycle', 'error');
          setSaving(false);
          return;
        }
        if (emailLifecycleResult.thread) {
          setEmailThreadInfo(emailLifecycleResult.thread);
        }
      }

      showToast('✅ Changes applied successfully!', 'success');

      // Reload everything
      await loadPersonData();

    } catch (error) {
      console.error('Error applying changes:', error);
      showToast('Failed to apply changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle creating a deal
  const handleCreateDeal = async () => {
    if (!dealForm.name.trim()) {
      showToast('Deal name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const result = await crmService.createDeal({
        personId: activity.personId,
        name: dealForm.name.trim(),
        description: dealForm.description,
        dealSize: parseFloat(dealForm.size) || 0,
        stage: dealForm.stage,
        dealType: dealForm.dealType || null,
        probability: parseInt(dealForm.probability) || 10,
        expectedCloseDate: dealForm.expectedCloseDate || null
      });

      if (result.success) {
        showToast('✅ Deal created successfully!', 'success');
        setShowDealForm(false);
        setDealForm({
          name: '',
          size: '',
          stage: 'lead',
          dealType: '',
          description: '',
          expectedCloseDate: '',
          probability: 10
        });
        await loadPersonData();
      } else {
        showToast(result.error || 'Failed to create deal', 'error');
      }
    } catch (error) {
      console.error('Error creating deal:', error);
      showToast('Failed to create deal', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle editing a deal - toggle edit mode
  const handleEditDeal = (dealId) => {
    setEditingDealId(editingDealId === dealId ? null : dealId);
  };

  // Handle saving a deal edit
  const handleSaveDealEdit = async (dealId) => {
    // Get values from the edit form fields
    const nameInput = document.getElementById(`deal-edit-name-${dealId}`);
    const sizeInput = document.getElementById(`deal-edit-size-${dealId}`);
    const stageSelect = document.getElementById(`deal-edit-stage-${dealId}`);
    const probInput = document.getElementById(`deal-edit-prob-${dealId}`);
    const dateInput = document.getElementById(`deal-edit-date-${dealId}`);
    const descInput = document.getElementById(`deal-edit-desc-${dealId}`);
    const typeSelect = document.getElementById(`deal-edit-type-${dealId}`);

    const updates = {};
    if (nameInput && nameInput.value) updates.name = nameInput.value;
    if (sizeInput) updates.dealSize = parseFloat(sizeInput.value) || 0;
    if (stageSelect) updates.stage = stageSelect.value;
    if (probInput) updates.probability = parseInt(probInput.value) || 10;
    if (dateInput) updates.expectedCloseDate = dateInput.value || null;
    if (descInput) updates.description = descInput.value;
    if (typeSelect) updates.dealType = typeSelect.value || null;

    setSaving(true);
    try {
      const result = await crmService.updateDeal(dealId, updates);
      if (result.success) {
        showToast('✅ Deal updated successfully!', 'success');
        setEditingDealId(null);
        await loadPersonData();
      } else {
        showToast(result.error || 'Failed to update deal', 'error');
      }
    } catch (error) {
      console.error('Error updating deal:', error);
      showToast('Failed to update deal', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingDealId(null);
  };

  // Handle deleting a deal
  const handleDeleteDeal = async (dealId) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    setSaving(true);
    try {
      const result = await crmService.deleteDeal(dealId);
      if (result.success) {
        showToast('✅ Deal deleted successfully!', 'success');
        await loadPersonData();
      } else {
        showToast(result.error || 'Failed to delete deal', 'error');
      }
    } catch (error) {
      console.error('Error deleting deal:', error);
      showToast('Failed to delete deal', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle creating a new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      showToast('Please enter a group name', 'error');
      return;
    }

    setSaving(true);
    try {
      const result = await crmService.createGroup(newGroupName.trim());
      if (result.success) {
        showToast('✅ Group created successfully!', 'success');
        setGroups([...groups, result.group]);
        setGroupId(result.group._id);
        setShowNewGroup(false);
        setNewGroupName('');
      } else {
        showToast(result.error || 'Failed to create group', 'error');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      showToast('Failed to create group', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Get LinkedIn URL
  const getLinkedInUrl = () => {
    if (activity?.linkedinPublicId) {
      return `https://www.linkedin.com/in/${activity.linkedinPublicId}/`;
    }
    return null;
  };

  if (!isOpen) return null;

  // Render loading state
  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading..." maxWidth="lg">
        <LoadingSpinner />
      </Modal>
    );
  }

  const linkedInUrl = getLinkedInUrl();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={person?.fullName || activity?.personName || 'Person Details'} maxWidth="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Person Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-800">{person?.fullName || activity?.personName}</span>
            {person?.title && (
              <span className="text-sm text-gray-500">• {person.title}</span>
            )}
            {person?.companyName && (
              <span className="text-sm text-gray-400">🏢 {person.companyName}</span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {activity?.channel === 'linkedin' ? '🔗' : '📧'} {activity?.channel || 'Unknown'} •
            {linkedInUrl && (
              <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                View LinkedIn Profile →
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('mm')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'mm' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Meeting Maker
          </button>
          <button
            onClick={() => setActiveTab('funnels')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'funnels' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Funnels
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'deals' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Deals ({deals.length})
          </button>
        </div>

        {/* ============================================================ */}
        {/* MEETING MAKER TAB */}
        {/* ============================================================ */}
        {activeTab === 'mm' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Person Type</label>
              <select
                value={personType}
                onChange={(e) => setPersonType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                disabled={saving}
              >
                <option value="prospect">Prospect</option>
                <option value="client">Client</option>
                <option value="friend">Friend</option>
                <option value="partner">Partner</option>
                <option value="investor">Investor</option>
                <option value="competitor">Competitor</option>
                <option value="expert">Expert</option>
                <option value="influencer">Influencer</option>
                <option value="person_of_interest">Person of Interest</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Agent</label>
              <select
                value={assignedAgentId}
                onChange={(e) => {
                  const agentId = e.target.value;
                  setAssignedAgentId(agentId);
                  if (agentId) {
                    crmService.getGroups(agentId).then(result => {
                      if (result.success) {
                        setGroups(result.groups || []);
                      }
                    });
                  } else {
                    setGroups([]);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                disabled={saving}
              >
                <option value="">-- No agent --</option>
                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.name || 'Unnamed agent'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
              <div className="flex gap-2">
                <select
                  value={groupId}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '__new__') {
                      setShowNewGroup(true);
                    } else {
                      setGroupId(value);
                      setShowNewGroup(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  disabled={saving}
                >
                  <option value="">Select group...</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                  <option value="__new__">➕ Type new group name...</option>
                </select>
              </div>
              {showNewGroup && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter new group name..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                    disabled={saving}
                  />
                  <button
                    onClick={handleCreateGroup}
                    disabled={saving}
                    className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowNewGroup(false);
                      setNewGroupName('');
                    }}
                    className="btn-secondary text-sm px-4 py-2"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleApplyChanges}
                disabled={saving}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {saving ? '⏳ Saving...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* FUNNELS TAB */}
        {/* ============================================================ */}
        {activeTab === 'funnels' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Funnel</label>
              <select
                value={channelPreference}
                onChange={(e) => setChannelPreference(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                disabled={saving}
              >
                <option value="linkedin">LinkedIn</option>
                <option value="email">Email</option>
              </select>
            </div>

            <hr className="border-gray-200" />

            {/* LinkedIn Funnel */}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-700">🔗 LinkedIn Funnel</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  linkedinState === 'open' ? 'bg-green-100 text-green-700' :
                  linkedinState === 'converted' ? 'bg-blue-100 text-blue-700' :
                  linkedinState === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                  linkedinState === 'do_not_contact' ? 'bg-red-100 text-red-700' :
                  linkedinState === 'archived' ? 'bg-gray-100 text-gray-500' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {linkedinState || 'open'}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 mt-1 text-sm">
                {formatThreadInfo(linkedinThreadInfo)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lifecycle State</label>
              <select
                value={linkedinState}
                onChange={(e) => setLinkedinState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                disabled={saving}
              >
                <option value="open">Open</option>
                <option value="connected">Connected</option>
                <option value="pending-connection">Pending Connection</option>
                <option value="in-conversation">In Conversation</option>
                <option value="paused">Paused</option>
                <option value="converted">Converted</option>
                <option value="irrelevant">Irrelevant</option>
                <option value="do_not_contact">Do not contact</option>
                <option value="archived">Archived</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Change</label>
              <input
                type="text"
                value={linkedinReason}
                onChange={(e) => setLinkedinReason(e.target.value)}
                placeholder="Optional reason"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                disabled={saving}
              />
            </div>

            <hr className="border-gray-200" />

            {/* Email Funnel */}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-700">📧 Email Funnel</h4>
                {emailState && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    emailState === 'open' ? 'bg-green-100 text-green-700' :
                    emailState === 'converted' ? 'bg-blue-100 text-blue-700' :
                    emailState === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                    emailState === 'do_not_contact' ? 'bg-red-100 text-red-700' :
                    emailState === 'archived' ? 'bg-gray-100 text-gray-500' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {emailState || 'No state'}
                  </span>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 mt-1 text-sm">
                {formatThreadInfo(emailThreadInfo)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="No email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lifecycle State</label>
              <select
                value={emailState}
                onChange={(e) => setEmailState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                disabled={saving}
              >
                <option value="">-- No state --</option>
                <option value="open">Open</option>
                <option value="in-conversation">In Conversation</option>
                <option value="paused">Paused</option>
                <option value="converted">Converted</option>
                <option value="irrelevant">Irrelevant</option>
                <option value="do_not_contact">Do not contact</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Change</label>
              <input
                type="text"
                value={emailReason}
                onChange={(e) => setEmailReason(e.target.value)}
                placeholder="Optional reason"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                disabled={saving}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleApplyChanges}
                disabled={saving}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {saving ? '⏳ Saving...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* DEALS TAB */}
        {/* ============================================================ */}
        {activeTab === 'deals' && (
          <div className="space-y-4">
            {/* Deals List */}
            {deals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No deals found for this person.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {deals.map((deal) => (
                  <div key={deal._id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {editingDealId === deal._id ? (
                      // ====== EDIT MODE ======
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                            <input
                              type="text"
                              id={`deal-edit-name-${deal._id}`}
                              defaultValue={deal.name || ''}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                              disabled={saving}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Size ($)</label>
                            <input
                              type="number"
                              id={`deal-edit-size-${deal._id}`}
                              defaultValue={deal.dealSize || 0}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                              disabled={saving}
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Stage</label>
                            <select
                              id={`deal-edit-stage-${deal._id}`}
                              defaultValue={deal.stage || 'lead'}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                              disabled={saving}
                            >
                              <option value="lead">Lead</option>
                              <option value="discovery">Discovery</option>
                              <option value="proposal">Proposal</option>
                              <option value="closed_won">Closed Won</option>
                              <option value="closed_lost">Closed Lost</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Deal Type</label>
                            <select
                              id={`deal-edit-type-${deal._id}`}
                              defaultValue={deal.dealType || ''}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                              disabled={saving}
                            >
                              <option value="">None</option>
                              {dealTypes.map((type) => (
                                <option key={type._id} value={type._id}>
                                  {type.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Probability: <span id={`deal-edit-prob-label-${deal._id}`}>{deal.probability || 10}%</span></label>
                          <input
                            type="range"
                            id={`deal-edit-prob-${deal._id}`}
                            min="0"
                            max="100"
                            defaultValue={deal.probability || 10}
                            className="w-full"
                            disabled={saving}
                            onChange={(e) => {
                              const label = document.getElementById(`deal-edit-prob-label-${deal._id}`);
                              if (label) label.textContent = `${e.target.value}%`;
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Expected Close Date</label>
                          <input
                            type="date"
                            id={`deal-edit-date-${deal._id}`}
                            defaultValue={deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split('T')[0] : ''}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                          <textarea
                            id={`deal-edit-desc-${deal._id}`}
                            defaultValue={deal.description || ''}
                            rows="2"
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
                            disabled={saving}
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleSaveDealEdit(deal._id)}
                            disabled={saving}
                            className="flex-1 btn-primary text-sm py-1.5 disabled:opacity-50"
                          >
                            {saving ? '⏳ Saving...' : '💾 Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="btn-secondary text-sm py-1.5 px-4"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // ====== VIEW MODE ======
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-800">{deal.name}</div>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                              <span>💰 {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deal.dealSize || 0)}</span>
                              {deal.dealType && (
                                <span>🏷️ {dealTypes.find(t => t._id === deal.dealType)?.name || 'Unknown'}</span>
                              )}
                              <span>📊 {deal.probability || 10}%</span>
                              {deal.expectedCloseDate && (
                                <span>📅 {new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Stage: <span className={`font-medium ${
                                deal.stage === 'closed_won' ? 'text-green-600' :
                                deal.stage === 'closed_lost' ? 'text-red-600' :
                                deal.stage === 'proposal' ? 'text-yellow-600' :
                                'text-gray-600'
                              }`}>{deal.stage || 'Lead'}</span>
                            </div>
                            {deal.description && (
                              <div className="text-xs text-gray-500 mt-1">{deal.description}</div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditDeal(deal._id)}
                              className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
                              disabled={saving}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDeal(deal._id)}
                              className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                              disabled={saving}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Create Deal Form */}
            {!showDealForm ? (
              <button
                onClick={() => setShowDealForm(true)}
                className="w-full btn-secondary text-sm py-2"
                disabled={saving}
              >
                + Create New Deal
              </button>
            ) : (
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name *</label>
                  <input
                    type="text"
                    value={dealForm.name}
                    onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="Enter deal name"
                    disabled={saving}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deal Size ($)</label>
                    <input
                      type="number"
                      value={dealForm.size}
                      onChange={(e) => setDealForm({ ...dealForm, size: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="0"
                      min="0"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                    <select
                      value={dealForm.stage}
                      onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      disabled={saving}
                    >
                      <option value="lead">Lead</option>
                      <option value="discovery">Discovery</option>
                      <option value="proposal">Proposal</option>
                      <option value="closed_won">Closed Won</option>
                      <option value="closed_lost">Closed Lost</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deal Type</label>
                    <select
                      value={dealForm.dealType}
                      onChange={(e) => setDealForm({ ...dealForm, dealType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      disabled={saving}
                    >
                      <option value="">None</option>
                      {dealTypes.map((type) => (
                        <option key={type._id} value={type._id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Probability (%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={dealForm.probability}
                      onChange={(e) => setDealForm({ ...dealForm, probability: parseInt(e.target.value) })}
                      className="w-full"
                      disabled={saving}
                    />
                    <div className="text-center text-sm text-gray-600">{dealForm.probability}%</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
                  <input
                    type="date"
                    value={dealForm.expectedCloseDate}
                    onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={dealForm.description}
                    onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
                    placeholder="Deal description (optional)"
                    disabled={saving}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateDeal}
                    disabled={saving}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    {saving ? '⏳ Saving...' : 'Save Deal'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDealForm(false);
                      setDealForm({
                        name: '',
                        size: '',
                        stage: 'lead',
                        dealType: '',
                        description: '',
                        expectedCloseDate: '',
                        probability: 10
                      });
                    }}
                    className="btn-secondary"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}