/**
 * RelativeMetricsPanel - Display metrics relative to benchmark
 * 
 * Formatting only - no calculations
 * Data comes directly from adapter
 */

import React from 'react';
import { RelativeMetrics } from '../../api/types';
import { formatPercent, formatDecimal } from '../../utils/number';

interface RelativeMetricsPanelProps {
  metrics: RelativeMetrics;
  title?: string;
}

export function RelativeMetricsPanel({
  metrics,
  title = 'Relative to Benchmark',
}: RelativeMetricsPanelProps) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '16px' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '8px 0', color: '#666' }}>Excess Return</td>
            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>
              {formatPercent(metrics.excess_return)}
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '8px 0', color: '#666' }}>Tracking Error</td>
            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>
              {formatPercent(metrics.tracking_error)}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '8px 0', color: '#666' }}>Information Ratio</td>
            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>
              {formatDecimal(metrics.information_ratio)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
