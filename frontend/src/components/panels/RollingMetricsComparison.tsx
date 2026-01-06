/**
 * RollingMetricsComparison - Compare rolling metrics across two portfolios
 * 
 * Core of V1.1 comparison feature
 * - Two lines per chart (Portfolio A blue, Portfolio B orange)
 * - Same window, same NaN regions
 * - Optional toggle: "Show only valid rolling period"
 * - Tooltip warns when metric undefined
 */

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TimeSeriesPoint } from '../../api/types';

type MetricType = 'rolling_volatility' | 'rolling_sharpe' | 'rolling_max_drawdown' | 'rolling_cagr';

interface RollingMetricsComparisonProps {
  portfolioALabel: string;
  portfolioBLabel: string;
  metricsA: { window_days?: number; series: Record<MetricType, TimeSeriesPoint[]> } | null;
  metricsB: { window_days?: number; series: Record<MetricType, TimeSeriesPoint[]> } | null;
}

const METRIC_LABELS: Record<MetricType, { title: string; description: string }> = {
  rolling_volatility: {
    title: 'Rolling Volatility',
    description: 'Annual standard deviation over rolling window',
  },
  rolling_sharpe: {
    title: 'Rolling Sharpe Ratio',
    description: 'Risk-adjusted return over rolling window',
  },
  rolling_max_drawdown: {
    title: 'Rolling Max Drawdown',
    description: 'Maximum peak-to-trough loss over rolling window',
  },
  rolling_cagr: {
    title: 'Rolling CAGR',
    description: 'Annualized return over rolling window',
  },
};

/**
 * Merge two rolling metric series on date
 */
function mergeRollingMetrics(
  seriesA: TimeSeriesPoint[],
  seriesB: TimeSeriesPoint[],
  labelA: string,
  labelB: string
): Array<{ date: string; [key: string]: string | number | null }> {
  const map = new Map<string, Record<string, number | null>>();

  seriesA.forEach(point => {
    if (!map.has(point.date)) {
      map.set(point.date, {});
    }
    map.get(point.date)![labelA] = point.value;
  });

  seriesB.forEach(point => {
    if (!map.has(point.date)) {
      map.set(point.date, {});
    }
    map.get(point.date)![labelB] = point.value;
  });

  return Array.from(map.entries())
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Find the first date where both series have valid values
 */
function findFirstValidDate(
  seriesA: TimeSeriesPoint[],
  seriesB: TimeSeriesPoint[]
): string | null {
  for (let i = 0; i < Math.max(seriesA.length, seriesB.length); i++) {
    const a = seriesA[i];
    const b = seriesB[i];
    if (a?.value !== null && b?.value !== null) {
      return a.date;
    }
  }
  return null;
}

/**
 * Custom tooltip
 */
function ComparisonTooltip(props: any) {
  const { active, payload, label } = props;

  if (!active || !payload) {
    return null;
  }

  // Check if any value is null
  const hasNull = payload.some((p: any) => p.value === null);

  return (
    <div style={styles.tooltip}>
      <p style={styles.tooltipDate}>{label}</p>
      {hasNull && (
        <p style={styles.tooltipWarning}>
          ⚠ Metric undefined until rolling window is complete
        </p>
      )}
      {payload.map((entry: any, idx: number) => (
        <p key={idx} style={{ ...styles.tooltipValue, color: entry.color }}>
          {entry.name}: {entry.value !== null ? entry.value.toFixed(4) : 'N/A'}
        </p>
      ))}
    </div>
  );
}

export function RollingMetricsComparison({
  portfolioALabel,
  portfolioBLabel,
  metricsA,
  metricsB,
}: RollingMetricsComparisonProps) {
  const [activeMetric, setActiveMetric] = useState<MetricType>('rolling_volatility');
  const [showOnlyValid, setShowOnlyValid] = useState(false);

  if (!metricsA || !metricsB) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <p style={styles.emptyTitle}>Rolling metrics loading...</p>
          <p style={styles.emptyDescription}>
            These metrics require the full backtest history and will appear
            once both portfolios complete their backtests.
          </p>
          <p style={styles.emptyNote}>
            💡 Tip: Rolling volatility requires ~12 months of history to stabilize
          </p>
        </div>
      </div>
    );
  }

  const seriesA = metricsA?.series[activeMetric];
  const seriesB = metricsB?.series[activeMetric];

  if (!seriesA || !seriesB) {
    return (
      <div style={styles.container}>
        <p style={styles.empty}>
          Rolling metrics are computed once sufficient history is available
        </p>
      </div>
    );
  }

  const mergedData = mergeRollingMetrics(seriesA, seriesB, portfolioALabel, portfolioBLabel);
  const firstValidDate = findFirstValidDate(seriesA, seriesB);

  let displayData = mergedData;
  let startIndex = 0;

  if (showOnlyValid && firstValidDate) {
    startIndex = mergedData.findIndex(d => d.date === firstValidDate);
    displayData = mergedData.slice(Math.max(0, startIndex));
  }

  const metricInfo = METRIC_LABELS[activeMetric];

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Rolling Metrics</h3>

      {/* Tab selector */}
      <div style={styles.tabs}>
        {(Object.keys(METRIC_LABELS) as MetricType[]).map(metric => (
          <button
            key={metric}
            style={{
              ...styles.tab,
              ...(activeMetric === metric ? styles.tabActive : styles.tabInactive),
            }}
            onClick={() => setActiveMetric(metric)}
          >
            {METRIC_LABELS[metric].title}
          </button>
        ))}
      </div>

      {/* Toggle for valid period */}
      <div style={styles.controls}>
        <label style={styles.label}>
          <input
            type="checkbox"
            checked={showOnlyValid}
            onChange={e => setShowOnlyValid(e.target.checked)}
            style={styles.checkbox}
          />
          {showOnlyValid ? '✓ Showing valid period only' : 'Show full date range (including NaN)'}
        </label>
      </div>

      {/* Metric description */}
      <div style={styles.description}>
        <p style={styles.descriptionText}>{metricInfo.description}</p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={displayData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval={Math.floor(displayData.length / 10) || 0}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<ComparisonTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '16px' }}
            iconType="line"
          />

          {/* Reference line marking where metrics become valid */}
          {firstValidDate && !showOnlyValid && (
            <ReferenceLine
              x={firstValidDate}
              stroke="#ccc"
              strokeWidth={1}
              strokeDasharray="3 3"
              label={{
                value: 'First valid point',
                position: 'top',
                fill: '#999',
                fontSize: 10,
                offset: 10,
              }}
            />
          )}

          <Line
            name={portfolioALabel}
            type="monotone"
            dataKey={portfolioALabel}
            stroke="#1976d2"
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            name={portfolioBLabel}
            type="monotone"
            dataKey={portfolioBLabel}
            stroke="#ff9800"
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
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

  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    borderBottom: '1px solid #e0e0e0',
  },

  tab: {
    padding: '8px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    color: '#999',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s ease',
  },

  tabActive: {
    color: '#1976d2',
    borderBottomColor: '#1976d2',
  },

  tabInactive: {
    color: '#999',
  },

  controls: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  },

  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#666',
    cursor: 'pointer',
  },

  checkbox: {
    cursor: 'pointer',
  },

  description: {
    marginBottom: '16px',
    padding: '8px 12px',
    backgroundColor: '#f5f5f5',
    borderLeft: '3px solid #1976d2',
    borderRadius: '4px',
  },

  descriptionText: {
    margin: 0,
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
  },

  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '12px',
  },

  tooltipDate: {
    margin: '0 0 4px 0',
    fontWeight: 'bold',
  },

  tooltipWarning: {
    margin: '2px 0',
    fontSize: '11px',
    fontStyle: 'italic',
    color: '#ffb74d',
  },

  tooltipValue: {
    margin: '2px 0',
  },

  empty: {
    textAlign: 'center',
    padding: '32px 16px',
    color: '#999',
    fontSize: '13px',
  },

  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },

  emptyTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },

  emptyDescription: {
    margin: '0 0 16px 0',
    fontSize: '13px',
    color: '#666',
    lineHeight: '1.5',
  },

  emptyNote: {
    margin: 0,
    fontSize: '12px',
    color: '#888',
    fontStyle: 'italic',
  },
};
