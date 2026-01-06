/**
 * EquityCashChart - Plot equity vs cash allocation over time
 * 
 * Pure & dumb: Receives TimeSeriesPoint[]
 * Shows composition of portfolio (non-stacked)
 */

import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ComposedChart,
} from 'recharts';
import { TimeSeriesPoint } from '../../api/types';

interface EquityCashChartProps {
  equity: TimeSeriesPoint[];
  cash: TimeSeriesPoint[];
  title?: string;
}

export function EquityCashChart({ equity, cash, title = 'Equity vs Cash' }: EquityCashChartProps) {
  // Merge time series data
  const data = equity.map((point, i) => ({
    date: point.date,
    equity: point.value,
    cash: i < cash.length ? cash[i].value : 0,
    total: (point.value || 0) + (i < cash.length && cash[i].value ? cash[i].value : 0),
  }));

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '16px' }}>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="#2563eb"
            fill="#93c5fd"
            name="Equity Value"
            opacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="cash"
            stroke="#16a34a"
            fill="#86efac"
            name="Cash Value"
            opacity={0.6}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#374151"
            strokeWidth={2}
            dot={false}
            name="Total NAV"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
