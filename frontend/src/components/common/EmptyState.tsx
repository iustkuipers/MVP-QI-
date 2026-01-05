/**
 * EmptyState Component
 * Displays empty state message
 */

import React from 'react';

interface EmptyStateProps {
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No data to display',
  action,
}) => {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '40px',
        color: '#999',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px',
      }}
    >
      <p style={{ fontSize: '16px', margin: '0 0 16px 0' }}>{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
