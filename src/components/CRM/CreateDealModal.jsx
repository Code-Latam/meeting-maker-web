import React, { useState, useRef } from 'react';
import { Modal } from '../Common/Modal';
import { crmService } from '../../services/crm';
import { useUIStore } from '../../store';

function CreateDealModal({ isOpen, dealTypes, onClose, onCreate }) {
  const { showToast } = useUIStore();
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dealSize: '',
    stage: 'lead',
    dealType: '',
    probability: 10,
    expectedCloseDate: '',
    actions: []
  });
  const [actionInput, setActionInput] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');
  const searchTimeout = useRef(null);

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const result = await crmService.searchPeople(query);
    setIsSearching(false);

    if (result.success) {
      setSearchResults(result.items || []);
    }
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearch(query), 300);
  };

  const selectPerson = (person) => {
    setSelectedPerson(person);
    setSearchQuery(person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim());
    setSearchResults([]);
  };

  const clearPerson = () => {
    setSelectedPerson(null);
    setSearchQuery('');
  };

  const addAction = () => {
    if (!actionInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { description: actionInput.trim(), dueDate: actionDueDate || null, status: 'pending' }]
    }));
    setActionInput('');
    setActionDueDate('');
  };

  const removeAction = (index) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedPerson) {
      showToast('Please select a person first', 'error');
      return;
    }

    if (!formData.name.trim()) {
      showToast('Deal name is required', 'error');
      return;
    }

    onCreate({
      personId: selectedPerson._id,
      name: formData.name.trim(),
      description: formData.description.trim(),
      dealSize: parseFloat(formData.dealSize) || 0,
      stage: formData.stage,
      dealType: formData.dealType || null,
      probability: parseInt(formData.probability) || 10,
      expectedCloseDate: formData.expectedCloseDate || null,
      actions: formData.actions
    });
  };

  const resetForm = () => {
    setSelectedPerson(null);
    setSearchQuery('');
    setSearchResults([]);
    setFormData({
      name: '',
      description: '',
      dealSize: '',
      stage: 'lead',
      dealType: '',
      probability: 10,
      expectedCloseDate: '',
      actions: []
    });
    setActionInput('');
    setActionDueDate('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Deal" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Person Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Person *</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="Type person name to search..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              autoComplete="off"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                {searchResults.map((person) => {
                  const fullName = person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown';
                  const details = [person.title, person.companyName].filter(Boolean).join(' • ');
                  return (
                    <div
                      key={person._id}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => selectPerson(person)}
                    >
                      <div className="font-medium text-sm text-gray-800">{fullName}</div>
                      {details && <div className="text-xs text-gray-500">{details}</div>}
                    </div>
                  );
                })}
              </div>
            )}
            {isSearching && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500 z-20">
                Searching...
              </div>
            )}
          </div>
        </div>

        {/* Selected Person */}
        {selectedPerson && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-sm text-gray-800">
                  {selectedPerson.fullName || `${selectedPerson.firstName || ''} ${selectedPerson.lastName || ''}`.trim() || 'Unknown'}
                </div>
                {selectedPerson.title && (
                  <div className="text-xs text-gray-600">{selectedPerson.title}</div>
                )}
                {selectedPerson.companyName && (
                  <div className="text-xs text-gray-500">🏢 {selectedPerson.companyName}</div>
                )}
              </div>
              <button
                type="button"
                onClick={clearPerson}
                className="text-sm text-red-500 hover:text-red-700"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        )}

        {/* Deal Details */}
        <div className={`space-y-4 ${!selectedPerson ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="e.g., Enterprise Contract"
              disabled={!selectedPerson}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
              placeholder="Deal details..."
              disabled={!selectedPerson}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deal Size ($)</label>
              <input
                type="number"
                value={formData.dealSize}
                onChange={(e) => setFormData(prev => ({ ...prev, dealSize: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="0"
                min="0"
                step="0.01"
                disabled={!selectedPerson}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deal Type</label>
              <select
                value={formData.dealType}
                onChange={(e) => setFormData(prev => ({ ...prev, dealType: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                disabled={!selectedPerson}
              >
                <option value="">None</option>
                {dealTypes.map((type) => (
                  <option key={type._id} value={type._id} style={{ color: type.color || '#000' }}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                disabled={!selectedPerson}
              >
                <option value="lead">Lead</option>
                <option value="discovery">Discovery</option>
                <option value="proposal">Proposal</option>
                <option value="closed_won">Closed Won</option>
                <option value="closed_lost">Closed Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Probability (%)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData(prev => ({ ...prev, probability: parseInt(e.target.value) }))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  disabled={!selectedPerson}
                />
                <span className="text-sm font-medium text-gray-700 min-w-[40px]">
                  {formData.probability}%
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
            <input
              type="date"
              value={formData.expectedCloseDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              disabled={!selectedPerson}
            />
          </div>

          {/* Actions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actions</label>
            <div className="space-y-2">
              {formData.actions.map((action, index) => (
                <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded">
                  <span className="flex-1 text-sm text-gray-700">{action.description}</span>
                  {action.dueDate && (
                    <span className="text-xs text-gray-500">Due: {new Date(action.dueDate).toLocaleDateString()}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAction(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  placeholder="Add action..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  disabled={!selectedPerson}
                  onKeyPress={(e) => e.key === 'Enter' && addAction()}
                />
                <input
                  type="date"
                  value={actionDueDate}
                  onChange={(e) => setActionDueDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  disabled={!selectedPerson}
                />
                <button
                  type="button"
                  onClick={addAction}
                  className="btn-secondary text-sm px-4"
                  disabled={!selectedPerson || !actionInput.trim()}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="flex-1 btn-primary"
            disabled={!selectedPerson}
          >
            Create Deal
          </button>
          <button type="button" onClick={handleClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateDealModal; // ✅ ADD THIS AT THE END