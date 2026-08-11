import React, { useEffect } from 'react';
import { useUIStore } from '../../store';

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'md',
  closeOnOutsideClick = true  // ✅ NEW: Allow disabling outside click
}) {
  const { isMobile } = useUIStore();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  // Desktop: Center modal
  if (!isMobile) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          // ✅ Only close if outside click is allowed AND clicking on backdrop
          if (closeOnOutsideClick && e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className={`bg-white rounded-2xl shadow-2xl ${maxWidthClasses[maxWidth] || maxWidthClasses.md} w-full max-h-[90vh] flex flex-col`}>
          {title && (
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          )}
          <div className="overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Mobile: Bottom sheet
  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          // ✅ Only close if outside click is allowed AND clicking on backdrop
          if (closeOnOutsideClick && e.target === e.currentTarget) {
            onClose();
          }
        }}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="sticky top-0 bg-white pt-3 pb-1 px-6">
          <div className="w-12 h-1 mx-auto bg-gray-300 rounded-full" />
        </div>
        {title && (
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-6 pb-8 safe-bottom">
          {children}
        </div>
      </div>
    </>
  );
}