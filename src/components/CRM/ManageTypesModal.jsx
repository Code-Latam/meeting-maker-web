import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { crmService } from '../../services/crm';
import { useUIStore } from '../../store';

export function ManageTypesModal({ isOpen, dealTypes, onClose, onTypesChange, onDealsRefresh }) {
  const { showToast } = useUIStore();
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#6b7280');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddType = async () => {
    if (!newTypeName.trim()) {
      showToast('Please enter a deal type name', 'error');
      return;
    }

    // Check for duplicate
    if (dealTypes.some(t => t.name.toLowerCase() === newTypeName.trim().toLowerCase())) {
      showToast('A deal type with this name already exists', 'error');
      return;
    }

    setIsAdding(true);
    const result = await crmService.createDealType(newTypeName.trim(), newTypeColor);
    setIsAdding(false);

    if (result.success) {
      showToast(`Deal type "${newTypeName}" created successfully`, 'success');
      setNewTypeName('');
      setNewTypeColor('#6b7280');
      await onTypesChange();
      await onDealsRefresh();
    } else {
      showToast(result.error || 'Failed to create deal type', 'error');
    }
  };

  const handleEditType = async (typeId, currentName, currentColor) => {
    const newName = prompt('Edit deal type name:', currentName);
    if (!newName || newName.trim() === currentName) return;

    const newColor = prompt('Edit deal type color (hex code, e.g., #6b7280):', currentColor);
    if (!newColor || !/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
      if (newColor !== null) {
        showToast('Invalid color format. Please use hex format (e.g., #6b7280)', 'error');
      }
      return;
    }

    const result = await crmService.updateDealType(typeId, newName.trim(), newColor);
    if (result.success) {
      showToast('Deal type updated successfully', 'success');
      await onTypesChange();
      await onDealsRefresh();
    } else {
      showToast(result.error || 'Failed to update deal type', 'error');
    }
  };

  const handleDeleteType = async (typeId, typeName, usageCount) => {
    const confirmMsg = usageCount > 0
      ? `⚠️ This deal type is used by ${usageCount} deal(s).\n\nAre you sure you want to delete it?`
      : `Are you sure you want to delete the deal type "${typeName}"?`;

    if (!confirm(confirmMsg)) return;

    const result = await crmService.deleteDealType(typeId);
    if (result.success) {
      showToast('Deal type deleted successfully', 'success');
      await onTypesChange();
      await onDealsRefresh();
    } else {
      showToast(result.error || 'Failed to delete deal type', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏷️ Manage Deal Types" maxWidth="md" closeOnOutsideClick={false}>
      <div className="space-y-4">
        {/* Add New Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Add New Deal Type</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="Enter type name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
              maxLength="50"
              onKeyPress={(e) => e.key === 'Enter' && handleAddType()}
            />
            <input
              type="color"
              value={newTypeColor}
              onChange={(e) => setNewTypeColor(e.target.value)}
              className="w-12 h-11 border border-gray-300 rounded-lg cursor-pointer p-0"
            />
            <button
              onClick={handleAddType}
              disabled={isAdding}
              className="btn-primary text-sm px-4 whitespace-nowrap"
            >
              {isAdding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>

        {/* Existing Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Deal Types</label>
          {dealTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-sm">No deal types created yet. Add your first type above!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {dealTypes.map((type) => (
                <div
                  key={type._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: type.color || '#6b7280' }}
                    />
                    <span className="font-medium text-sm text-gray-800">{type.name}</span>
                    <span className="text-xs text-gray-400">({type.usageCount || 0} deals)</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditType(type._id, type.name, type.color)}
                      className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteType(type._id, type.name, type.usageCount || 0)}
                      className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button onClick={onClose} className="flex-1 btn-secondary">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ManageTypesModal; 