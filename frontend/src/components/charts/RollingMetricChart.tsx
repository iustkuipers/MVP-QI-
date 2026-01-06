/**
 * RollingMetricChart - Generic rolling metric visualization
 * 
 * This is a dumb component:
 * - Receives data (TimeSeriesPoint[])
 * - Renders a line chart
 * - Handles null values explicitly
 * - Shows visual cues for window accumulation
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
  ReferenceLine,
} from 'recharts';
import { TimeSeriesPoint } from '../../api/types';

interface RollingMetricChartProps {
  title: string;
  description: string;
  data: TimeSeriesPoint[];
  windowDays?: number;
  showOnlyValid?: boolean;
}

/**
 * Custom tooltip to show null explicitly
 */
function CustomTooltip(props: any) {
  const { active, payload } = props;

  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload as { date: string; value: number | null };

  return (
    <div style={styles.tooltip}>
      <p style={styles.tooltipDate}>{data.date}</p>
      {data.value !== null ? (
        <p style={styles.tooltipValue}>
          Value: {data.value.toFixed(4)}
        </p>
      ) : (
        <p style={styles.tooltipEmpty}>Not enough data yet</p>
      )}
    </div>
  );
}

export function RollingMetricChart({
  title,
  description,
  data,
  windowDays = 252,
  showOnlyValid = false,
}: RollingMetricChartProps) {
  const hasData = data.some(p => p.value !== null);
  
  // Find the index where rolling metrics first become valid (first non-null value)
  const firstValidIndex = data.findIndex(p => p.value !== null);
  const firstValidDate = firstValidIndex >= 0 ? data[firstValidIndex].date : null;

  // Filter data if showing only valid period
  const displayData = showOnlyValid && firstValidIndex >= 0 ? data.slice(firstValidIndex) : data;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.description}>{description}</p>
        {windowDays && (
          <p style={styles.window}>Window: {windowDays} trading days (~12 months)</p>
        )}
      </div>

      {hasData ? (
        <div style={styles.chartWrapper}>
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
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference line marking first valid rolling metric (only show if not filtered) */}
              {firstValidDate && !showOnlyValid && (
                <ReferenceLine
                  x={firstValidDate}
                  stroke="#4caf50"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{
                    value: 'First valid rolling value',
                    position: 'top',
                    fill: '#4caf50',
                    fontSize: 11,
                    offset: 10,
                  }}
                />
              )}
              
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1976d2"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <p>Values are shown only when enough historical data is available.</p>
        </div>
      )}

    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
  },

  header: {
    marginBottom: '16px',
  },

  title: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 4px 0',
  },

  description: {
    fontSize: '13px',
    color: '#666',
    margin: '4px 0',
  },

  window: {
    fontSize: '12px',
    color: '#999',
    margin: '4px 0 0 0',
    fontStyle: 'italic',
  },

  chartWrapper: {
    position: 'relative',
    marginBottom: '16px',
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
    margin: 0,
  },

  tooltipEmpty: {
    margin: 0,
    fontStyle: 'italic',
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

  microcopyContainer: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderLeft: '3px solid #1976d2',
    borderRadius: '4px',
    fontSize: '13px',
  },

  microcopy: {
    margin: '0 0 8px 0',
    fontWeight: '500',
    color: '#333',
  },

  microcopyList: {
    margin: '0',
    paddingLeft: '20px',
    color: '#666',
    lineHeight: '1.6',
  },
};
