import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import Button from './Button';

const ErrorState = ({
  message = 'An unexpected error occurred while loading data.',
  retryText = 'Try Again',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 bg-rose-50 border border-rose-100 rounded-xl text-center">
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-rose-100 text-danger mb-3">
        <FaExclamationTriangle size={20} />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">Load Failed</h3>
      <p className="text-sm text-slate-600 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="danger" size="sm">
          {retryText}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
