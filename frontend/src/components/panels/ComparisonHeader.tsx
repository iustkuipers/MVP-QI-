/**
 * ComparisonHeader - Shows which portfolios are being compared
 * 
 * Non-negotiable: avoids confusion about which is A vs B
 * Optional: shows what differs between configs
 */

import React from 'react';

interface ComparisonHeaderProps {
  labelA: string;
  labelB: string;
  configDifference?: string;
}

export function ComparisonHeader({
  labelA,
  labelB,
  configDifference,
}: ComparisonHeaderProps) {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Comparing</h2>
      <div style={styles.comparison}>
        <span style={styles.label}>{labelA}</span>
        <span style={styles.separator}>vs</span>
        <span style={styles.label}>{labelB}</span>
      </div>
      {configDifference && (
        <p style={styles.hint}>
          <strong>Differences:</strong> {configDifference}
        </p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: '24px',
  },

  title: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    margin: '0 0 8px 0',
  },

  comparison: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },

  label: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1976d2',
    padding: '8px 12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },

  separator: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#999',
  },

  hint: {
    margin: '12px 0 0 0',
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
  },
};
