/**
 * Backtest adapter layer
 * Transforms raw API response into UI-friendly structure
 * Frontend code never touches raw API responses
 * 
 * CRITICAL: Scalar metrics and rolling metrics are kept SEPARATE
 * This prevents silent bugs and ensures type safety
 */

import { BacktestResponse, RollingMetricsResponse, TimeSeriesPoint } from '../api/types';

/**
 * Convert { dates: [], values: [] } to { date, value }[] format
 */
function transformTimeSeries(series: { dates: string[]; values: number[] }): TimeSeriesPoint[] {
  return series.dates.map((date, i) => ({
    date,
    value: series.values[i],
  }));
}

export function adaptBacktest(response: BacktestResponse) {
  if (!response.success) {
    throw new Error('Backtest failed');
  }

  // Transform rolling metrics if they exist
  const rollingMetrics = response.rolling_metrics
    ? {
        window_days: response.rolling_metrics.window_days,
        series: {
          rolling_volatility: response.rolling_metrics.series.rolling_volatility,
          rolling_sharpe: response.rolling_metrics.series.rolling_sharpe,
          rolling_max_drawdown: response.rolling_metrics.series.rolling_max_drawdown,
          rolling_cagr: response.rolling_metrics.series.rolling_cagr,
        },
      }
    : null;

  return {
    // Time series data - keep in original format for single mode charts
    navSeries: transformTimeSeries(response.series.nav),
    equitySeries: transformTimeSeries(response.series.equity),
    cashSeries: transformTimeSeries(response.series.cash),
    benchmarkSeries: response.series.benchmark_nav ? transformTimeSeries(response.series.benchmark_nav) : null,
    
    // Scalar metrics only
    portfolioMetrics: response.portfolio_metrics,
    relativeMetrics: response.relative_metrics ?? null,
    
    // Rolling metrics - SEPARATE from scalar metrics
    rollingMetrics,
    
    // Issues
    issues: response.issues,
  };
}
