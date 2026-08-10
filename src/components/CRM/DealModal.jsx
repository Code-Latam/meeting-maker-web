import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { useUIStore } from '../../store';

export default function DealModal({ isOpen, deal, dealTypes, onClose, onSave }) {
  const { showToast } = useUIStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dealSize: '',
    stage: 'lead',
    dealType: '',
    probability: 10,
    expectedCloseDate: '',
    closedReason: '',
    actions: []
  });
  const [isLocked, setIsLocked] = useState(false);
  const [isClosedWon, setIsClosedWon] = useState(false);
  const [commissionStatus, setCommissionStatus] = useState('');
  const [newActionDesc, setNewActionDesc] = useState('');
  const [newActionDueDate, setNewActionDueDate] = useState('');

  useEffect(() => {
    if (deal) {
      const closedWon = deal.stage === 'closed_won';
      const locked = deal.commissionStatus === 'paid';
      
      setIsLocked(locked);
      setIsClosedWon(closedWon);
      setCommissionStatus(deal.commissionStatus || 'pending');

      const formattedActions = (deal.actions || []).map(action => ({
        ...action,
        dueDate: action.dueDate || null
      }));

      setFormData({
        name: deal.name || '',
        description: deal.description || '',
        dealSize: deal.dealSize || '',
        stage: deal.stage || 'lead',
        dealType: deal.dealType || '',
        probability: deal.probability || 10,
        expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split('T')[0] : '',
        closedReason: deal.closedReason || '',
        actions: formattedActions
      });
    }
  }, [deal]);

  const handleChange = (field, value) => {
    if (field === 'stage' && formData.stage === 'closed_won' && value !== 'closed_won' && value !== 'closed_lost') {
      if (commissionStatus === 'paid') {
        showToast('🔒 Cannot move this deal. The commission has been paid and the deal is locked.', 'error');
        return;
      }
      
      const confirmMove = window.confirm(
        `⚠️ This deal is currently in "Closed Won" with a ${commissionStatus} commission.\n\n` +
        `Moving it to "${value}" will VOID the commission and invoice.\n\n` +
        `Are you sure you want to continue?`
      );
      if (!confirmMove) {
        return;
      }
    }

    if (field === 'stage' && formData.stage !== 'closed_won' && value === 'closed_won') {
      if (commissionStatus === 'paid') {
        showToast('This deal already has a paid commission. Cannot close again.', 'error');
        return;
      }
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAction = () => {
    if (!newActionDesc.trim()) {
      showToast('Please enter an action description', 'error');
      return;
    }

    const newAction = {
      description: newActionDesc.trim(),
      dueDate: newActionDueDate || null,
      status: 'pending'
    };

    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
    setNewActionDesc('');
    setNewActionDueDate('');
  };

  const handleRemoveAction = (index) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const handleActionStatusChange = (index, status) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, status } : action
      )
    }));
  };

  const handleActionDescriptionChange = (index, description) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, description } : action
      )
    }));
  };

  const handleActionDueDateChange = (index, dueDate) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, dueDate } : action
      )
    }));
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast('Deal name is required', 'error');
      return;
    }

    const updates = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      dealSize: parseFloat(formData.dealSize) || 0,
      stage: formData.stage || 'lead',
      dealType: formData.dealType || null,
      probability: parseInt(formData.probability) || 10,
      expectedCloseDate: formData.expectedCloseDate || null,
      closedReason: formData.closedReason?.trim() || '',
      actions: formData.actions || []
    };

    onSave(deal._id, updates);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'canceled': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  if (!deal) return null;

  const isStageLocked = isLocked || (isClosedWon && commissionStatus === 'pending');
  const isSizeLocked = isClosedWon || isLocked;
  const isTypeLocked = isLocked;
  const isActionsLocked = isLocked;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Deal" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="e.g., Enterprise Contract"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
            placeholder="Deal details..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deal Size ($)</label>
          <input
            type="number"
            value={formData.dealSize}
            onChange={(e) => handleChange('dealSize', e.target.value)}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
              isSizeLocked ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="0"
            min="0"
            step="0.01"
            disabled={isSizeLocked}
          />
          {isClosedWon && commissionStatus !== 'paid' && (
            <p className="text-xs text-yellow-600 mt-1">⚠️ Deal size cannot be edited in Closed Won</p>
          )}
          {isLocked && (
            <p className="text-xs text-red-500 mt-1">🔒 Deal is locked (commission paid)</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deal Type</label>
          <select
            value={formData.dealType}
            onChange={(e) => handleChange('dealType', e.target.value)}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
              isTypeLocked ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            disabled={isTypeLocked}
          >
            <option value="">None</option>
            {dealTypes.map((type) => (
              <option key={type._id} value={type._id} style={{ color: type.color || '#000' }}>
                {type.name}
              </option>
            ))}
          </select>
          {isLocked && (
            <p className="text-xs text-red-500 mt-1">🔒 Deal type cannot be changed (commission paid)</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
          <select
            value={formData.stage}
            onChange={(e) => handleChange('stage', e.target.value)}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
              isStageLocked ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            disabled={isStageLocked}
          >
            <option value="lead">Lead</option>
            <option value="discovery">Discovery</option>
            <option value="proposal">Proposal</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </select>
          {isLocked && (
            <p className="text-xs text-red-500 mt-1">🔒 Stage cannot be changed (commission paid)</p>
          )}
          {isClosedWon && commissionStatus === 'pending' && !isLocked && (
            <p className="text-xs text-yellow-600 mt-1">
              ⚠️ Moving from Closed Won will void the commission and invoice
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Probability (%)</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={formData.probability}
              onChange={(e) => handleChange('probability', parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              disabled={isLocked}
            />
            <span className="text-sm font-medium text-gray-700 min-w-[40px]">
              {formData.probability}%
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
          <input
            type="date"
            value={formData.expectedCloseDate}
            onChange={(e) => handleChange('expectedCloseDate', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Closed Reason (if lost)</label>
          <input
            type="text"
            value={formData.closedReason}
            onChange={(e) => handleChange('closedReason', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="e.g., Price, Competitor, Not interested"
          />
        </div>

        {deal.commissionStatus && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Commission Status:</span>
              <span className={`text-sm font-semibold ${
                deal.commissionStatus === 'paid' ? 'text-green-600' :
                deal.commissionStatus === 'pending' ? 'text-yellow-600' :
                deal.commissionStatus === 'in_transit' ? 'text-blue-600' :
                deal.commissionStatus === 'voided' ? 'text-gray-500' :
                'text-red-600'
              }`}>
                {deal.commissionStatus.charAt(0).toUpperCase() + deal.commissionStatus.slice(1)}
              </span>
            </div>
            {deal.commissionStatus === 'paid' && (
              <p className="text-xs text-red-500 mt-1">🔒 This deal is locked. Cannot change stage or type.</p>
            )}
          </div>
        )}

        {/* Actions Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Actions</label>
          
          <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
            {formData.actions.length === 0 ? (
              <div className="text-sm text-gray-400 italic">No actions yet. Add one below.</div>
            ) : (
              formData.actions.map((action, index) => (
                <div key={index} className="flex flex-col gap-1 bg-gray-50 p-2 rounded border border-gray-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={action.description}
                      onChange={(e) => handleActionDescriptionChange(index, e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="Action description..."
                      disabled={isActionsLocked}
                    />
                    
                    <input
                      type="date"
                      value={formatDateForDisplay(action.dueDate)}
                      onChange={(e) => handleActionDueDateChange(index, e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent outline-none w-32"
                      disabled={isActionsLocked}
                    />
                    
                    <select
                      value={action.status || 'pending'}
                      onChange={(e) => handleActionStatusChange(index, e.target.value)}
                      className={`px-2 py-1 text-sm rounded border border-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-transparent outline-none ${getStatusColor(action.status || 'pending')}`}
                      disabled={isActionsLocked}
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="completed">✅ Completed</option>
                      <option value="canceled">❌ Canceled</option>
                    </select>
                    
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(index)}
                      className="text-red-500 hover:text-red-700 text-sm px-2"
                      disabled={isActionsLocked}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {!isActionsLocked && (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newActionDesc}
                onChange={(e) => setNewActionDesc(e.target.value)}
                placeholder="Add new action..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAction())}
              />
              <input
                type="date"
                value={newActionDueDate}
                onChange={(e) => setNewActionDueDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-36"
              />
              <button
                type="button"
                onClick={handleAddAction}
                className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
              >
                + Add
              </button>
            </div>
          )}
          {isActionsLocked && (
            <p className="text-xs text-red-500 mt-1">🔒 Actions cannot be modified (commission paid)</p>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button type="submit" className="flex-1 btn-primary">
            Save Changes
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}