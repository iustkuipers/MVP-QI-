/**
 * ModeToggle - Switch between Single and Compare modes
 * 
 * Disabled if only one result exists
 * Shows tooltip when disabled
 */

import React from 'react';

interface ModeToggleProps {
  mode: 'single' | 'compare';
  onModeChange: (mode: 'single' | 'compare') => void;
  disabled?: boolean;
  disabledTooltip?: string;
}

export function ModeToggle({
  mode,
  onModeChange,
  disabled = false,
  disabledTooltip,
}: ModeToggleProps) {
  return (
    <div style={styles.container} title={disabled ? disabledTooltip : undefined}>
      <div style={styles.toggleGroup}>
        <button
          style={{
            ...styles.button,
            ...(mode === 'single' ? styles.buttonActive : styles.buttonInactive),
          }}
          onClick={() => !disabled && onModeChange('single')}
          disabled={disabled}
        >
          Single
        </button>
        <button
          style={{
            ...styles.button,
            ...(mode === 'compare' ? styles.buttonActive : styles.buttonInactive),
          }}
          onClick={() => !disabled && onModeChange('compare')}
          disabled={disabled}
        >
          Compare
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px',
  },

  toggleGroup: {
    display: 'flex',
    borderRadius: '4px',
    overflow: 'hidden',
    border: '1px solid #d0d0d0',
    backgroundColor: '#fafafa',
  },

  button: {
    padding: '8px 16px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },

  buttonActive: {
    backgroundColor: '#1976d2',
    color: '#ffffff',
  },

  buttonInactive: {
    backgroundColor: 'transparent',
    color: '#666',
  },
};
