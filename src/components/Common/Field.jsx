import React from 'react';

export function Field({ label, htmlFor, error, hint, className = '', children }) {
  return (
    <div className={`field ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
