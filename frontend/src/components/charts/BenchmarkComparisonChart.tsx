/**
 * BenchmarkComparisonChart - Compare strategy vs benchmark
 * 
 * Pure & dumb: Only plots { dates[], values[] }
 * Not used yet - keeping for future multi-strategy comparison
 */

import React from 'react';
import { TimeSeries } from '../../api/types';

interface BenchmarkComparisonChartProps {
  strategy: TimeSeries;
  benchmark: TimeSeries;
  title?: string;
}

export function BenchmarkComparisonChart({
  strategy,
  benchmark,
  title = 'Strategy vs Benchmark',
}: BenchmarkComparisonChartProps) {
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
        <p>Strategy: {strategy.dates.length} points | Benchmark: {benchmark.dates.length} points</p>
      </div>
    </div>
  );
}
