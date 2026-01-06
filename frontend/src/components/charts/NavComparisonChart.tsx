/**
 * NavComparisonChart - Two NAV lines on shared axes
 * 
 * Portfolio A (blue) vs Portfolio B (orange)
 * No normalization, no rebasing
 * This is observation, not judgment
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TimeSeriesPoint } from '../../api/types';

interface NavComparisonChartProps {
  portfolioALabel: string;
  portfolioBLabel: string;
  dataA: TimeSeriesPoint[];
  dataB: TimeSeriesPoint[];
}

/**
 * Merge two time series on date
 */
function mergeTimeSeriesData(
  dataA: TimeSeriesPoint[],
  dataB: TimeSeriesPoint[],
  labelA: string,
  labelB: string
): Array<{ date: string; [key: string]: string | number | null }> {
  const map = new Map<string, Record<string, number | null>>();

  // Add Portfolio A
  dataA.forEach(point => {
    if (!map.has(point.date)) {
      map.set(point.date, {});
    }
    map.get(point.date)![labelA] = point.value;
  });

  // Add Portfolio B
  dataB.forEach(point => {
    if (!map.has(point.date)) {
      map.set(point.date, {});
    }
    map.get(point.date)![labelB] = point.value;
  });

  // Convert to array and sort by date
  return Array.from(map.entries())
    .map(([date, values]) => ({
      date,
      ...values,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Custom tooltip
 */
function CustomTooltip(props: any) {
  const { active, payload, label } = props;

  if (!active || !payload) {
    return null;
  }

  return (
    <div style={styles.tooltip}>
      <p style={styles.tooltipDate}>{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} style={{ ...styles.tooltipValue, color: entry.color }}>
          {entry.name}: ${entry.value ? entry.value.toFixed(2) : 'N/A'}
        </p>
      ))}
    </div>
  );
}

export function NavComparisonChart({
  portfolioALabel,
  portfolioBLabel,
  dataA,
  dataB,
}: NavComparisonChartProps) {
  const mergedData = mergeTimeSeriesData(dataA, dataB, portfolioALabel, portfolioBLabel);

  if (!mergedData.length) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Portfolio Value Over Time</h3>
        <div style={styles.emptyState}>
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Portfolio Value Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={mergedData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval={Math.floor(mergedData.length / 10) || 0}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '16px' }}
            iconType="line"
          />
          <Line
            name={portfolioALabel}
            type="monotone"
            dataKey={portfolioALabel}
            stroke="#1976d2"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            name={portfolioBLabel}
            type="monotone"
            dataKey={portfolioBLabel}
            stroke="#ff9800"
            dot={false}
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

  tooltipValue: {
    margin: '2px 0',
  },

  emptyState: {
    height: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    color: '#999',
    fontSize: '14px',
  },
};
