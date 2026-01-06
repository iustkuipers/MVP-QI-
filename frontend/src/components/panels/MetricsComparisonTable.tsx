/**
 * MetricsComparisonTable - Side-by-side static metrics with metric-aware delta coloring
 * 
 * Shows Portfolio A, Portfolio B, and Difference (A - B)
 * Color semantics:
 * - Green: Portfolio A improvement
 * - Red: Portfolio A deterioration
 * - Gray: negligible difference
 * 
 * Accounts for metric direction (higher-is-better vs lower-is-better)
 * No bolding winners — analytical instrument, not scoreboard
 */

import React from 'react';

interface MetricsComparisonTableProps {
  portfolioALabel: string;
  portfolioBLabel: string;
  metricsA: Record<string, number | string>;
  metricsB: Record<string, number | string>;
  metricLabels: Record<string, string>;
  formatters: Record<string, (value: number) => string>;
}

interface Metric {
  key: string;
  label: string;
  valueA: number;
  valueB: number;
  delta: number;
  formatter: (v: number) => string;
  direction: 'higher' | 'lower'; // which direction is better
}

// Define per-metric direction of goodness
const METRIC_DIRECTION: Record<string, 'higher' | 'lower'> = {
  total_return: 'higher',
  cagr: 'higher',
  sharpe: 'higher',
  volatility: 'lower',
  max_drawdown: 'lower',
};

export function MetricsComparisonTable({
  portfolioALabel,
  portfolioBLabel,
  metricsA,
  metricsB,
  metricLabels,
  formatters,
}: MetricsComparisonTableProps) {
  // Build metric rows
  const metrics: Metric[] = Object.keys(metricLabels).map(key => ({
    key,
    label: metricLabels[key],
    valueA: typeof metricsA[key] === 'number' ? metricsA[key] : 0,
    valueB: typeof metricsB[key] === 'number' ? metricsB[key] : 0,
    delta: (typeof metricsA[key] === 'number' ? metricsA[key] : 0) -
           (typeof metricsB[key] === 'number' ? metricsB[key] : 0),
    formatter: formatters[key] || (v => v.toString()),
    direction: METRIC_DIRECTION[key] || 'higher',
  }));

  /**
   * Determine if delta is an improvement or deterioration
   * Returns color based on semantic meaning, not mathematical sign
   */
  const getDeltaColor = (metric: Metric): string => {
    const { delta, direction } = metric;
    
    // Negligible change
    if (Math.abs(delta) < 0.001) return '#e8e8e8'; // neutral gray
    
    // Determine if this delta is an improvement
    const isImprovement = 
      (direction === 'higher' && delta > 0) ||
      (direction === 'lower' && delta < 0);
    
    if (isImprovement) return '#c8e6c9'; // light green
    if (!isImprovement) return '#ffcccc'; // light red
    
    return '#e8e8e8';
  };

  const getTooltip = (metric: Metric): string => {
    if (Math.abs(metric.delta) < 0.001) {
      return 'Negligible difference';
    }
    
    const direction = metric.direction === 'higher' ? 'higher' : 'lower';
    const sign = metric.delta > 0 ? 'increased' : 'decreased';
    return `${direction.charAt(0).toUpperCase() + direction.slice(1)} is better. Portfolio A ${sign} this metric.`;
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Performance Metrics</h3>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.headerCell}>Metric</th>
              <th style={{ ...styles.headerCell, ...styles.columnCenter }}>
                {portfolioALabel}
              </th>
              <th style={{ ...styles.headerCell, ...styles.columnCenter }}>
                {portfolioBLabel}
              </th>
              <th
                style={{ ...styles.headerCell, ...styles.columnCenter }}
                title="Positive means Portfolio A outperforms B for this metric"
              >
                <div>
                  Difference (A − B)
                  <div style={styles.headerSubtext}>
                    Positive: Portfolio A outperforms
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, idx) => (
              <tr
                key={metric.key}
                style={{
                  ...styles.bodyRow,
                  backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9',
                }}
              >
                <td style={styles.labelCell}>{metric.label}</td>
                <td style={{ ...styles.valueCell, ...styles.columnCenter }}>
                  {metric.formatter(metric.valueA)}
                </td>
                <td style={{ ...styles.valueCell, ...styles.columnCenter }}>
                  {metric.formatter(metric.valueB)}
                </td>
                <td
                  style={{
                    ...styles.valueCell,
                    ...styles.columnCenter,
                    backgroundColor: getDeltaColor(metric),
                    borderRadius: '4px',
                  }}
                  title={getTooltip(metric)}
                >
                  <span style={styles.deltaValue}>
                    {metric.delta >= 0 ? '+' : ''}{metric.formatter(metric.delta)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: '24px',
  },

  title: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 16px 0',
  },

  tableWrapper: {
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },

  headerRow: {
    borderBottom: '2px solid #ddd',
  },

  headerCell: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#f9f9f9',
  },

  headerSubtext: {
    fontSize: '11px',
    fontWeight: '400',
    color: '#999',
    marginTop: '2px',
  },

  columnCenter: {
    textAlign: 'center',
  },

  bodyRow: {
    borderBottom: '1px solid #e0e0e0',
  },

  labelCell: {
    padding: '12px',
    fontWeight: '500',
    color: '#333',
  },

  valueCell: {
    padding: '12px',
    color: '#666',
  },

  deltaValue: {
    fontWeight: '500',
  },
};
