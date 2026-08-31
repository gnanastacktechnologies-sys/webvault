import React from 'react';
import { FaFolderOpen } from 'react-icons/fa';
import Button from './Button';

const EmptyState = ({
  title = 'No records found',
  description = 'Start building your personal collection by creating an entry.',
  actionText,
  onActionClick,
  icon: Icon = FaFolderOpen,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 bg-card border border-border/60 rounded-xl shadow-sm text-center">
      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
        <Icon size={28} />
      </div>
      <h3 className="text-lg font-bold text-heading mb-1.5">{title}</h3>
      <p className="text-sm text-secondary-text max-w-sm mb-6">{description}</p>
      {actionText && onActionClick && (
        <Button onClick={onActionClick} size="md">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
