import React, { createContext, useContext, useState, useCallback } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message) => addToast(message, 'success'), [addToast]);
  const error = useCallback((message) => addToast(message, 'error'), [addToast]);
  const warning = useCallback((message) => addToast(message, 'warning'), [addToast]);
  const info = useCallback((message) => addToast(message, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          let bgColor = 'bg-blue-600';
          let Icon = FaInfoCircle;

          if (toast.type === 'success') {
            bgColor = 'bg-emerald-600';
            Icon = FaCheckCircle;
          } else if (toast.type === 'error') {
            bgColor = 'bg-rose-600';
            Icon = FaExclamationCircle;
          } else if (toast.type === 'warning') {
            bgColor = 'bg-amber-500';
            Icon = FaExclamationCircle;
          }

          return (
            <div
              key={toast.id}
              className={`flex items-center justify-between p-4 rounded-lg shadow-lg text-white transform transition-all duration-300 translate-y-0 opacity-100 pointer-events-auto ${bgColor}`}
              role="alert"
            >
              <div className="flex items-center gap-3">
                <Icon className="flex-shrink-0 text-lg" />
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 hover:opacity-80 transition-opacity p-1 text-white/80 hover:text-white"
                aria-label="Close notification"
              >
                <FaTimes size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
