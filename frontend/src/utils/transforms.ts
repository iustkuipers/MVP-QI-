/**
 * Transform utilities
 * Convert API structures to chart-compatible formats
 * Preserve null, dates, and ordering
 */

import { TimeSeriesPoint, RollingMetricsResponse } from '../api/types';

/**
 * Convert TimeSeriesPoint[] to chart-compatible format
 * Preserves null values and ordering
 */
export function transformRollingMetricsToChart(
  data: TimeSeriesPoint[]
): Array<{ date: string; value: number | null }> {
  return data.map(point => ({
    date: point.date,
    value: point.value,
  }));
}

/**
 * Get all rolling metric series as chart data
 */
export function getRollingMetricsChartData(
  rollingMetrics: RollingMetricsResponse | null
) {
  if (!rollingMetrics) {
    return null;
  }

  return {
    volatility: transformRollingMetricsToChart(
      rollingMetrics.series.rolling_volatility
    ),
    sharpe: transformRollingMetricsToChart(
      rollingMetrics.series.rolling_sharpe
    ),
    maxDrawdown: transformRollingMetricsToChart(
      rollingMetrics.series.rolling_max_drawdown
    ),
    cagr: transformRollingMetricsToChart(
      rollingMetrics.series.rolling_cagr
    ),
  };
}

/**
 * Check if rolling metrics are available and have data
 */
export function hasRollingMetrics(
  rollingMetrics: RollingMetricsResponse | null
): boolean {
  if (!rollingMetrics) return false;
  if (!rollingMetrics.series) return false;

  return (
    rollingMetrics.series.rolling_volatility.length > 0 ||
    rollingMetrics.series.rolling_sharpe.length > 0 ||
    rollingMetrics.series.rolling_max_drawdown.length > 0 ||
    rollingMetrics.series.rolling_cagr.length > 0
  );
}
