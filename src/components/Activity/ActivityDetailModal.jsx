import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../Common/Modal';
import { useUIStore } from '../../store';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { crmService } from '../../services/crm';
import { agentsService } from '../../services/agents';
import { MessageList } from './MessageList';
import { DealNotesEditor } from '../CRM/DealNotesEditor';
import { DealActionsEditor } from '../CRM/DealActionsEditor';

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
  const [personId, setPersonId] = useState(null);
  const [deals, setDeals] = useState([]);
  const [agents, setAgents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [dealTypes, setDealTypes] = useState([]);
  const [messageChannel, setMessageChannel] = useState('all');

  // Form states
  const [personType, setPersonType] = useState('prospect');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [channelPreference, setChannelPreference] = useState('linkedin');
  const [emailAddress, setEmailAddress] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

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
    probability: 10,
    actions: [],
    notes: []
  });
  const [editingDeal, setEditingDeal] = useState(null);

  // Task form (attached to a deal)
  const [showNewTask, setShowNewTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ description: '', dueDate: '', dealId: '' });

  // Tabs
  const [activeTab, setActiveTab] = useState('gi');

  // Sync the editable "General Information" fields from a person object
  const syncGiFields = (p) => {
    if (!p) return;
    setFirstName(p.firstName || '');
    setLastName(p.lastName || '');
    setTitle(p.title || '');
    setCompanyName(p.companyName || '');
    setPhone(
      p.phone ||
      p.dedupe?.primaryPhoneE164 ||
      p.channels?.find((c) => c.type === 'sms' || c.type === 'whatsapp')?.identifiers?.phoneE164 ||
      ''
    );
    setEmailAddress(
      p.channels?.find((c) => c.type === 'email')?.identifiers?.email ||
      p.dedupe?.primaryEmail ||
      ''
    );
    setLinkedinUrl(
      p.channels?.find((c) => c.type === 'linkedin')?.identifiers?.profileUrl ||
      (p.dedupe?.linkedinPublicId ? `https://www.linkedin.com/in/${p.dedupe.linkedinPublicId}/` : '') ||
      ''
    );
  };

  // Sync group from activity data when it becomes available
  useEffect(() => {
    if (activity?.group && !loading) {
      setGroups(prev => {
        const exists = prev.some(g => g._id === activity.group._id);
        if (!exists) {
          return [...prev, activity.group];
        }
        return prev;
      });
      if (!groupId) {
        setGroupId(activity.group._id);
      }
    }
  }, [activity?.group, loading, groupId]);

  // Load person data
  const loadPersonData = useCallback(async () => {
    // Try multiple ways to get the person ID
    let id = null;

    if (activity?.personId) {
      id = activity.personId;
    } else if (activity?.person?.id) {
      id = activity.person.id;
    } else if (activity?.person?._id) {
      id = activity.person._id;
    } else if (activity?.id) {
      id = activity.id;
    } else if (activity?._id) {
      id = activity._id;
    }

    if (!id && activity?.person) {
      id = activity.person._id || activity.person.id;
    }

    if (!id) {
      showToast('Could not find person information', 'error');
      setLoading(false);
      return;
    }

    setPersonId(id);
    setLoading(true);

    try {
      let personData = null;
      let useExistingData = false;

      if (activity?.assignedAgentId !== undefined || activity?.groupId !== undefined) {
        personData = {
          _id: id,
          fullName: activity.personName || 'Unknown',
          firstName: activity.personName?.split(' ')[0] || '',
          lastName: activity.personName?.split(' ').slice(1).join(' ') || '',
          title: activity.personTitle || '',
          companyName: activity.personCompany || '',
          personType: activity.personType || 'prospect',
          assignedAgentId: activity.assignedAgentId || null,
          groupId: activity.groupId || null,
          group: activity.group || null,
          channelPreference: activity.channelPreference || 'linkedin',
          linkedinPublicId: activity.linkedinPublicId || '',
          profile: activity.profile || {},
          threads: [],
          channels: [],
          meeting: activity.meeting || {}
        };

        useExistingData = true;

        if (activity.group && activity.group._id) {
          setGroups([activity.group]);
          setGroupId(activity.group._id);
        }

        setPerson(personData);
        setPersonType(personData.personType);
        setAssignedAgentId(personData.assignedAgentId || '');
        setGroupId(personData.groupId || '');
        setChannelPreference(personData.channelPreference || 'linkedin');
      }

      // Always fetch the full person data for threads and other details
      const personResult = await crmService.getPerson(id);

      if (personResult.success && personResult.person) {
        const p = personResult.person;

        if (useExistingData && personData) {
          const mergedPerson = {
            ...personData,
            ...p,
            assignedAgentId: personData.assignedAgentId || p.assignedAgentId,
            groupId: personData.groupId || p.groupId,
            group: personData.group || p.group,
          };
          setPerson(mergedPerson);

          setPersonType(mergedPerson.personType || 'prospect');
          setAssignedAgentId(mergedPerson.assignedAgentId || '');
          setGroupId(mergedPerson.groupId || '');
          setChannelPreference(mergedPerson.channelPreference || 'linkedin');

          if (p.group && p.group._id) {
            setGroups(prev => {
              const exists = prev.some(g => g._id === p.group._id);
              if (!exists) {
                return [...prev, p.group];
              }
              return prev;
            });
            if (!groupId) {
              setGroupId(p.group._id);
            }
          }
        } else {
          setPerson(p);
          setPersonType(p.personType || 'prospect');
          setAssignedAgentId(p.assignedAgentId || '');
          setGroupId(p.groupId || '');
          setChannelPreference(p.channelPreference || 'linkedin');

          if (p.group && p.group._id) {
            setGroups(prev => {
              const exists = prev.some(g => g._id === p.group._id);
              if (!exists) {
                return [...prev, p.group];
              }
              return prev;
            });
            setGroupId(p.group._id);
          }
        }

        const finalPerson = personResult.person;
        syncGiFields(finalPerson);

        const linkedinThread = finalPerson?.threads?.find(t => t.channel === 'linkedin');
        if (linkedinThread) {
          setLinkedinThreadInfo(linkedinThread);
          setLinkedinState(linkedinThread.lifecycle?.state || 'open');
          setLinkedinReason(linkedinThread.lifecycle?.reason || '');
        } else {
          setLinkedinThreadInfo(null);
        }

        const emailThread = finalPerson?.threads?.find(t => t.channel === 'email');
        if (emailThread) {
          setEmailThreadInfo(emailThread);
          setEmailState(emailThread.lifecycle?.state || '');
          setEmailReason(emailThread.lifecycle?.reason || '');
        } else {
          setEmailThreadInfo(null);
        }
      }

      // Get agents
      if (agents.length === 0) {
        const agentsResult = await agentsService.getAgents();
        if (agentsResult.success) {
          setAgents(agentsResult.agents || []);
        }
      }

      // Get deal types
      if (dealTypes.length === 0) {
        const typesResult = await crmService.getDealTypes();
        if (typesResult.success) {
          setDealTypes(typesResult.types || []);
        }
      }

      // Get deals for this person
      if (deals.length === 0 && id) {
        const dealsResult = await crmService.getDealsForPerson(id);
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
  }, [activity, showToast, agents.length, dealTypes.length, deals.length, groupId]);

  useEffect(() => {
    if (isOpen && activity) {
      setGroups([]);
      setGroupId('');
      loadPersonData();
    }
  }, [isOpen, activity]);

  // Handle applying changes
  const handleApplyChanges = async () => {
    if (!person || !personId) return;

    setSaving(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();

      // 1. Update person (single PATCH for all General Information fields)
      const updates = {
        firstName,
        lastName,
        fullName,
        title,
        companyName,
        phone,
        email: emailAddress,
        linkedinUrl,
        personType,
        assignedAgentId: assignedAgentId || null,
        groupId: groupId || null,
        channelPreference
      };

      const updateResult = await crmService.updatePerson(personId, updates);
      if (!updateResult.success) {
        showToast(updateResult.error || 'Failed to update person', 'error');
        setSaving(false);
        return;
      }
      setPerson(updateResult.person);

      // 2. Update LinkedIn lifecycle
      if (linkedinState) {
        const lifecycleResult = await crmService.updateLifecycleState(
          personId,
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

      // 3. Update email lifecycle if state changed
      const currentEmailState = emailThreadInfo?.lifecycle?.state || '';
      if (emailState && emailState !== currentEmailState) {
        const emailLifecycleResult = await crmService.updateEmailLifecycle(
          personId,
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

      showToast('Changes applied successfully!', 'success');

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

    if (!personId) {
      showToast('No person selected', 'error');
      return;
    }

    setSaving(true);
    try {
      const result = await crmService.createDeal({
        personId: personId,
        name: dealForm.name.trim(),
        description: dealForm.description,
        dealSize: parseFloat(dealForm.size) || 0,
        stage: dealForm.stage,
        dealType: dealForm.dealType || null,
        probability: parseInt(dealForm.probability) || 10,
        expectedCloseDate: dealForm.expectedCloseDate || null,
        actions: dealForm.actions || [],
        notes: dealForm.notes || []
      });

      if (result.success) {
        showToast('Deal created successfully!', 'success');
        setShowDealForm(false);
        setDealForm({
          name: '',
          size: '',
          stage: 'lead',
          dealType: '',
          description: '',
          expectedCloseDate: '',
          probability: 10,
          actions: [],
          notes: []
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
  const handleEditDeal = (deal) => {
    setEditingDeal(editingDeal && editingDeal._id === deal._id ? null : { ...deal });
  };

  const updateEditingDeal = (field, value) => {
    setEditingDeal(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  // Handle saving a deal edit
  const handleSaveDealEdit = async () => {
    if (!editingDeal) return;

    const updates = {
      name: editingDeal.name,
      description: editingDeal.description || '',
      dealSize: parseFloat(editingDeal.dealSize) || 0,
      stage: editingDeal.stage || 'lead',
      dealType: editingDeal.dealType || null,
      probability: parseInt(editingDeal.probability) || 10,
      expectedCloseDate: editingDeal.expectedCloseDate || null,
      actions: editingDeal.actions || [],
      notes: editingDeal.notes || []
    };

    setSaving(true);
    try {
      const result = await crmService.updateDeal(editingDeal._id, updates);
      if (result.success) {
        showToast('Deal updated successfully!', 'success');
        setEditingDeal(null);
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
    setEditingDeal(null);
  };

  // Handle deleting a deal
  const handleDeleteDeal = async (dealId) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    setSaving(true);
    try {
      const result = await crmService.deleteDeal(dealId);
      if (result.success) {
        showToast('Deal deleted successfully!', 'success');
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
        showToast('Group created successfully!', 'success');
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

  // Mark a task complete
  const handleMarkTaskComplete = async (task) => {
    const updatedActions = (task.deal.actions || []).map((a, i) =>
      i === task.index ? { ...a, status: 'completed' } : a
    );
    setSaving(true);
    try {
      const result = await crmService.updateDeal(task.deal._id, { actions: updatedActions });
      if (result.success) {
        showToast('Task marked complete', 'success');
        await loadPersonData();
      } else {
        showToast(result.error || 'Failed to update task', 'error');
      }
    } catch (error) {
      showToast('Failed to update task', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Create a task attached to a deal
  const handleCreateTask = async () => {
    if (!taskForm.description.trim()) {
      showToast('Task description is required', 'error');
      return;
    }
    if (!taskForm.dealId) {
      showToast('Select a deal for this task', 'error');
      return;
    }
    const deal = deals.find((d) => d._id === taskForm.dealId);
    if (!deal) {
      showToast('Deal not found', 'error');
      return;
    }
    const updatedActions = [...(deal.actions || []), { description: taskForm.description.trim(), dueDate: taskForm.dueDate || null, status: 'pending' }];
    setSaving(true);
    try {
      const result = await crmService.updateDeal(deal._id, { actions: updatedActions });
      if (result.success) {
        showToast('Task added', 'success');
        setTaskForm({ description: '', dueDate: '', dealId: '' });
        setShowNewTask(false);
        await loadPersonData();
      } else {
        showToast(result.error || 'Failed to add task', 'error');
      }
    } catch (error) {
      showToast('Failed to add task', 'error');
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
      <Modal isOpen={isOpen} onClose={onClose} title="Loading..." maxWidth="lg" closeOnOutsideClick={false}>
        <LoadingSpinner />
      </Modal>
    );
  }

  const linkedInUrl = getLinkedInUrl();

  const pendingTasks = deals
    .flatMap((deal) =>
      (deal.actions || []).map((action, index) => ({ ...action, index, deal })).filter((a) => a.status === 'pending')
    )
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  const formatTaskDate = (d) => {
    if (!d) return 'No due date';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? String(d).slice(0, 10) : dt.toLocaleDateString();
  };

  const isTaskOverdue = (d) => {
    if (!d) return false;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dt < today;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={person?.fullName || activity?.personName || 'Person Details'} maxWidth="lg" closeOnOutsideClick={false}>
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
            onClick={() => setActiveTab('gi')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'gi' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            General Information
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'messages' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            💬 Messages
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'deals' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Deals ({deals.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'tasks' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tasks ({pendingTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('funnels')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'funnels' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Funnels
          </button>
        </div>

        {/* ============================================================ */}
        {/* GENERAL INFORMATION TAB */}
        {/* ============================================================ */}
        {activeTab === 'gi' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="input"
                placeholder="https://www.linkedin.com/in/username/"
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="input"
                  placeholder="email@example.com"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input"
                  placeholder="+1 555 000 0000"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Person Type</label>
              <select
                value={personType}
                onChange={(e) => setPersonType(e.target.value)}
                className="input"
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
                className="input"
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
                  value={groupId || ''}
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
        {/* MESSAGES TAB */}
        {/* ============================================================ */}
        {activeTab === 'messages' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-700">💬 Conversation History</h4>
                <span className="text-xs text-gray-400">
                  (All messages across all channels)
                </span>
              </div>
              <div className="flex gap-1">
                {['all', 'linkedin', 'email'].map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setMessageChannel(ch)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      messageChannel === ch
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {ch === 'all' ? 'All' : ch === 'linkedin' ? '🔗 LinkedIn' : '📧 Email'}
                  </button>
                ))}
              </div>
            </div>
            {personId ? (
              <MessageList personId={personId} channel={messageChannel} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Loading messages...</p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* DEALS TAB */}
        {/* ============================================================ */}
        {activeTab === 'deals' && (
          <div className="space-y-4">
            {deals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No deals found for this person.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {deals.map((deal) => (
                  <div key={deal._id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {editingDeal && editingDeal._id === deal._id ? (
                      // ====== EDIT MODE ======
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                            <input
                              type="text"
                              value={editingDeal.name || ''}
                              onChange={(e) => updateEditingDeal('name', e.target.value)}
                              className="input"
                              disabled={saving}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Size ($)</label>
                            <input
                              type="number"
                              value={editingDeal.dealSize || 0}
                              onChange={(e) => updateEditingDeal('dealSize', e.target.value)}
                              className="input"
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
                              value={editingDeal.stage || 'lead'}
                              onChange={(e) => updateEditingDeal('stage', e.target.value)}
                              className="input"
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
                              value={editingDeal.dealType || ''}
                              onChange={(e) => updateEditingDeal('dealType', e.target.value)}
                              className="input"
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
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Probability: {editingDeal.probability || 10}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingDeal.probability || 10}
                            onChange={(e) => updateEditingDeal('probability', parseInt(e.target.value))}
                            className="w-full"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Expected Close Date</label>
                          <input
                            type="date"
                            value={editingDeal.expectedCloseDate ? new Date(editingDeal.expectedCloseDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => updateEditingDeal('expectedCloseDate', e.target.value)}
                            className="input"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                          <textarea
                            value={editingDeal.description || ''}
                            onChange={(e) => updateEditingDeal('description', e.target.value)}
                            rows="2"
                            className="input resize-y"
                            disabled={saving}
                          />
                        </div>

                        <DealActionsEditor
                          actions={editingDeal.actions || []}
                          onChange={(actions) => updateEditingDeal('actions', actions)}
                          allowStatus
                        />
                        <DealNotesEditor
                          notes={editingDeal.notes || []}
                          onChange={(notes) => updateEditingDeal('notes', notes)}
                        />

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleSaveDealEdit}
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
                            {deal.notes && deal.notes.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">📝 {deal.notes.length} note(s)</div>
                            )}
                            {deal.actions && deal.actions.some(a => a.status === 'pending') && (
                              <div className="text-xs text-gray-500 mt-1">
                                📌 {deal.actions.filter(a => a.status === 'pending').length} pending task(s)
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditDeal(deal)}
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
                    className="input"
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
                      className="input"
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
                      className="input"
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
                      className="input"
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
                    className="input"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={dealForm.description}
                    onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })}
                    rows="2"
                    className="input resize-y"
                    placeholder="Deal description (optional)"
                    disabled={saving}
                  />
                </div>

                <DealActionsEditor
                  actions={dealForm.actions}
                  onChange={(actions) => setDealForm((prev) => ({ ...prev, actions }))}
                />
                <DealNotesEditor
                  notes={dealForm.notes}
                  onChange={(notes) => setDealForm((prev) => ({ ...prev, notes }))}
                />

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
                        probability: 10,
                        actions: [],
                        notes: []
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

        {/* ============================================================ */}
        {/* TASKS TAB */}
        {/* ============================================================ */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No pending tasks for this person.</p>
              </div>
            ) : (
              pendingTasks.map((task, i) => {
                const overdue = isTaskOverdue(task.dueDate);
                return (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{task.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{task.deal.name}</p>
                      <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                        {overdue ? 'Overdue: ' : 'Due: '}
                        {formatTaskDate(task.dueDate)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleMarkTaskComplete(task)}
                      disabled={saving}
                      className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0"
                    >
                      Mark Complete
                    </button>
                  </div>
                );
              })
            )}

            {!showNewTask ? (
              <button
                onClick={() => setShowNewTask(true)}
                disabled={saving || deals.length === 0}
                className="w-full btn-secondary text-sm py-2 disabled:opacity-50"
                title={deals.length === 0 ? 'Create a deal first to add tasks' : ''}
              >
                + Add Task
              </button>
            ) : (
              <div className="border-t border-gray-200 pt-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Description *</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    rows={3}
                    className="input resize-y"
                    placeholder="What needs to be done?"
                    disabled={saving}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="input"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deal *</label>
                    <select
                      value={taskForm.dealId}
                      onChange={(e) => setTaskForm({ ...taskForm, dealId: e.target.value })}
                      className="input"
                      disabled={saving}
                    >
                      <option value="">Select deal...</option>
                      {deals.map((deal) => (
                        <option key={deal._id} value={deal._id}>{deal.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateTask}
                    disabled={saving}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Task'}
                  </button>
                  <button
                    onClick={() => { setShowNewTask(false); setTaskForm({ description: '', dueDate: '', dealId: '' }); }}
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
                className="input"
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
                className="input"
                disabled={saving}
              >
                <option value="open">Open</option>
                <option value="connected">Connected</option>
                <option value="pending-connection">Pending Connection</option>
                <option value="in-conversation">In Conversation</option>
                <option value="in-conversation-ignoring-limits">In Conversation (Ignore Limits)</option>
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
                className="input"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Lifecycle State</label>
              <select
                value={emailState}
                onChange={(e) => setEmailState(e.target.value)}
                className="input"
                disabled={saving}
              >
                <option value="">-- No state --</option>
                <option value="open">Open</option>
                <option value="in-conversation">In Conversation</option>
                <option value="in-conversation-ignoring-limits">In Conversation (Ignore Limits)</option>
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
                className="input"
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
      </div>
    </Modal>
  );
}
