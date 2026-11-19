import React, { useState } from 'react';
import { X } from 'lucide-react';

function fmtDate(d) {
  if (!d) return '';
  const s = String(d);
  if (s.length >= 10) return s.slice(0, 10);
  return s;
}

export function DealActionsEditor({ actions = [], onChange, allowStatus = false }) {
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const addAction = () => {
    const d = description.trim();
    if (!d) return;
    onChange([...(actions || []), { description: d, dueDate: dueDate || null, status: 'pending' }]);
    setDescription('');
    setDueDate('');
  };

  const removeAction = (index) => {
    onChange((actions || []).filter((_, i) => i !== index));
  };

  const updateAction = (index, field, value) => {
    onChange((actions || []).map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  };

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 mb-1.5">Tasks</span>

      {(actions || []).length > 0 && (
        <div className="space-y-2 mb-2">
          {(actions || []).map((action, i) => (
            <div key={i} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={action.description || ''}
                  onChange={(e) => updateAction(i, 'description', e.target.value)}
                  placeholder="Task description"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeAction(i)}
                  className="text-gray-400 hover:text-red-600 flex-shrink-0"
                  aria-label="Remove task"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fmtDate(action.dueDate)}
                  onChange={(e) => updateAction(i, 'dueDate', e.target.value)}
                  className="input w-auto"
                />
                {allowStatus && (
                  <select
                    value={action.status || 'pending'}
                    onChange={(e) => updateAction(i, 'status', e.target.value)}
                    className="input w-auto"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a task..."
          className="input flex-1"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="input w-auto"
        />
        <button type="button" onClick={addAction} className="btn-secondary text-sm px-3 flex-shrink-0">
          Add
        </button>
      </div>
    </div>
  );
}
