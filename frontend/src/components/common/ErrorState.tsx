/**
 * ErrorState Component
 * Displays error message
 */

import React from 'react';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#ffebee',
        border: '1px solid #ef5350',
        borderRadius: '4px',
        color: '#c62828',
      }}
    >
      <h3 style={{ marginTop: 0 }}>Error</h3>
      <p>{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef5350',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
};
