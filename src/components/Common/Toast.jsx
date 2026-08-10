import React, { useEffect } from 'react';
import { useUIStore } from '../../store';

export function Toast() {
  const { toast, hideToast } = useUIStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(hideToast, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  if (!toast) return null;

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }[toast.type] || 'bg-gray-800';

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center px-4 lg:bottom-8">
      <div className={`${bgColor} text-white px-4 py-3 rounded-xl shadow-lg max-w-md w-full text-center text-sm`}>
        {toast.message}
      </div>
    </div>
  );
}