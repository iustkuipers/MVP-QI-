/**
 * EquityCashChart - Plot equity vs cash allocation over time
 * 
 * Pure & dumb: Only plots { dates[], values[] }
 */

import React from 'react';
import { TimeSeries } from '../../api/types';

interface EquityCashChartProps {
  equity: TimeSeries;
  cash: TimeSeries;
  title?: string;
}

export function EquityCashChart({ equity, cash, title = 'Equity vs Cash' }: EquityCashChartProps) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '16px' }}>
      <h3>{title}</h3>
      {/* TODO: Integrate with Recharts or preferred charting library */}
      <div
        style={{
          height: '300px',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p>Equity: {equity.dates.length} points | Cash: {cash.dates.length} points</p>
      </div>
    </div>
  );
}
