/**
 * Issues Panel Component
 * Displays warnings and issues from the backtest
 * 
 * Principle: Panels render data, don't compute it
 */

import React from 'react';

interface IssuesPanelProps {
  issues: string[];
  title?: string;
}

export const IssuesPanel: React.FC<IssuesPanelProps> = ({
  issues,
  title = 'Issues & Warnings',
}) => {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div style={{ border: '1px solid #ffa000', borderRadius: '4px', padding: '16px', backgroundColor: '#fff8e1' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <ul style={{ margin: 0, paddingLeft: '20px' }}>
        {issues.map((issue, idx) => (
          <li key={idx} style={{ marginBottom: '8px' }}>
            {issue}
          </li>
        ))}
      </ul>
    </div>
  );
};
