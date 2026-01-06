/**
 * NavChart - Plot portfolio NAV with optional benchmark overlay
 * 
 * Pure & dumb: Receives TimeSeriesPoint[]
 * Supports benchmark overlay
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TimeSeriesPoint } from '../../api/types';

interface NavChartProps {
  series: TimeSeriesPoint[];
  benchmark?: TimeSeriesPoint[] | null;
  title?: string;
}

export function NavChart({ series, benchmark, title = 'Portfolio NAV' }: NavChartProps) {
  // Merge series data
  const data = series.map((point, i) => ({
    date: point.date,
    nav: point.value,
    ...(benchmark && i < benchmark.length && { benchmark: benchmark[i].value }),
  }));

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '16px' }}>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          {benchmark && <Legend />}
          <Line
            type="monotone"
            dataKey="nav"
            stroke="#2563eb"
            dot={false}
            name="Portfolio NAV"
          />
          {benchmark && (
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#9ca3af"
              strokeDasharray="5 5"
              dot={false}
              name="Benchmark NAV"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
