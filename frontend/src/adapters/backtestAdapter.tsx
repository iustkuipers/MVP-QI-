/**
 * Backtest adapter layer
 * Transforms raw API response into UI-friendly structure
 * Frontend code never touches raw API responses
 */

import { BacktestResponse } from '../api/types';

export function adaptBacktest(response: BacktestResponse) {
  if (!response.success) {
    throw new Error('Backtest failed');
  }

  return {
    navSeries: response.series.nav,
    equitySeries: response.series.equity,
    cashSeries: response.series.cash,
    benchmarkSeries: response.series.benchmark_nav ?? null,
    portfolioMetrics: response.portfolio_metrics,
    relativeMetrics: response.relative_metrics ?? null,
    issues: response.issues,
  };
}
