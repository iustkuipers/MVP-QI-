/**
 * PortfolioMetricsPanel - Display portfolio metrics
 * 
 * Formatting only - no calculations
 * Metrics come formatted from adapter
 */

import React from 'react';
import { PortfolioMetrics } from '../../api/types';
import { formatPercent, formatDecimal } from '../../utils/number';

interface PortfolioMetricsPanelProps {
  metrics: PortfolioMetrics;
  title?: string;
}

export function PortfolioMetricsPanel({
  metrics,
  title = 'Portfolio Metrics',
}: PortfolioMetricsPanelProps) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '16px' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ fontSize: '12px', color: '#999', marginBottom: '12px', fontStyle: 'italic' }}>
        Metrics are computed ex-post based on realized returns.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '8px 0', color: '#666' }}>Total Return</td>
            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>
              {formatPercent(metrics.total_return)}
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '8px 0', color: '#666' }}>CAGR</td>
            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>
              {formatPercent(metrics.cagr)}
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '8px 0', color: '#666' }}>Realized volatility (σ)</td>
            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>
              {formatPercent(metrics.volatility)}
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '8px 0', color: '#666' }}>Ex-post Sharpe ratio</td>
            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>
              {formatDecimal(metrics.sharpe)}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '8px 0', color: '#666' }}>Max Drawdown</td>
            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>
              {formatPercent(metrics.max_drawdown)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
