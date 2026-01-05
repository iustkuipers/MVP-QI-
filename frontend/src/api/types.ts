/**
 * API Types - Mirror backend responses 1:1
 * Source of truth: app/tests/fixtures/example_response.json
 */

/**
 * Time series data structure
 * Used for all series: nav, equity, cash, benchmark_nav
 */
export interface TimeSeries {
  dates: string[];
  values: number[];
}

/**
 * All backtest series
 * benchmark_nav is optional when no benchmark is provided
 */
export interface BacktestSeries {
  nav: TimeSeries;
  equity: TimeSeries;
  cash: TimeSeries;
  benchmark_nav?: TimeSeries;
}

/**
 * Portfolio performance metrics
 * These are ABSOLUTE metrics for the strategy
 */
export interface PortfolioMetrics {
  total_return: number;
  cagr: number;
  volatility: number;
  sharpe: number;
  max_drawdown: number;
}

/**
 * Metrics relative to benchmark
 * Only present when benchmark_nav is provided
 */
export interface RelativeMetrics {
  excess_return: number;
  tracking_error: number;
  information_ratio: number;
}

/**
 * Complete backtest response
 * Mirrors backend BacktestResponse exactly
 */
export interface BacktestResponse {
  success: boolean;
  series: BacktestSeries;
  portfolio_metrics: PortfolioMetrics;
  relative_metrics?: RelativeMetrics;
  issues: string[];
}

/**
 * Backtest request payload
 */
export interface BacktestRequest {
  start_date: string;
  end_date: string;
  initial_cash: number;
  positions: {
    ticker: string;
    weight: number;
  }[];
  risk_free_rate: number;
  benchmark_ticker?: string;
  rebalance: string;
  fractional_shares: boolean;
  risk_free_compounding: string;
  data_provider: string;
}
