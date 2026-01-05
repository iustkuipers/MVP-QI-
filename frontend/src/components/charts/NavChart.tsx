/**
 * NavChart - Plot portfolio NAV with optional benchmark overlay
 * 
 * Pure & dumb: Only plots { dates[], values[] }
 * Supports turning benchmark on/off, multiple strategies later
 */

import React from 'react';
import { TimeSeries } from '../../api/types';

interface NavChartProps {
  series: TimeSeries;
  benchmark?: TimeSeries | null;
  title?: string;
}

export function NavChart({ series, benchmark, title = 'Portfolio NAV' }: NavChartProps) {
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
        <p>
          NAV: {series.dates.length} points
          {benchmark && ` | Benchmark: ${benchmark.dates.length} points`}
        </p>
      </div>
    </div>
  );
}
