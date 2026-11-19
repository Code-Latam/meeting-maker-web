import React, { useState } from 'react';
import { X } from 'lucide-react';

function fmtDate(d) {
  if (!d) return '';
  const s = String(d);
  if (s.length >= 10) return s.slice(0, 10);
  return s;
}

export function DealNotesEditor({ notes = [], onChange }) {
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const addNote = () => {
    const t = text.trim();
    if (!t) return;
    onChange([...(notes || []), { text: t, date: date || new Date().toISOString().slice(0, 10) }]);
    setText('');
  };

  const removeNote = (index) => {
    onChange((notes || []).filter((_, i) => i !== index));
  };

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 mb-1.5">Notes</span>

      {(notes || []).length > 0 && (
        <div className="space-y-2 mb-2">
          {(notes || []).map((note, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{note.text}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmtDate(note.date)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeNote(i)}
                className="text-gray-400 hover:text-red-600 flex-shrink-0"
                aria-label="Remove note"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Add a note..."
          className="input resize-y"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-auto"
          />
          <button type="button" onClick={addNote} className="btn-secondary text-sm px-3 flex-shrink-0">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
