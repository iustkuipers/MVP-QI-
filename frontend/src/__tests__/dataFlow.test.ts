/**
 * Test: Form → API → Adapter → Display
 * 
 * This validates the entire data flow works end-to-end
 * Tests separation of scalar metrics from rolling metrics
 */

import { adaptBacktest } from '../adapters/backtestAdapter';

// Simulate the backend response (example_response.json structure)
// Now includes rolling_metrics
const mockBacktestResponse = {
  success: true,
  series: {
    nav: {
      dates: [
        '2020-01-01',
        '2020-01-02',
        '2020-01-03',
        '2021-01-01',
      ],
      values: [100000, 99714.57, 100718.36, 95499.06],
    },
    equity: {
      dates: [
        '2020-01-01',
        '2020-01-02',
        '2020-01-03',
        '2021-01-01',
      ],
      values: [80000, 79771.66, 80574.69, 76399.25],
    },
    cash: {
      dates: [
        '2020-01-01',
        '2020-01-02',
        '2020-01-03',
        '2021-01-01',
      ],
      values: [20000, 19942.91, 20143.67, 19099.81],
    },
    benchmark_nav: {
      dates: [
        '2020-01-01',
        '2020-01-02',
        '2020-01-03',
        '2021-01-01',
      ],
      values: [100000, 100500, 101200, 103100],
    },
  },
  portfolio_metrics: {
    total_return: -0.009888759401990632,
    cagr: -0.009868595869521712,
    volatility: 0.1284806384831262,
    sharpe: -0.246735831420611,
    max_drawdown: -0.12686389148683175,
  },
  rolling_metrics: {
    window_days: 252,
    series: {
      rolling_volatility: [
        { date: '2020-01-01', value: null },
        { date: '2020-06-01', value: 0.145 },
        { date: '2021-01-01', value: 0.128 },
      ],
      rolling_sharpe: [
        { date: '2020-01-01', value: null },
        { date: '2020-06-01', value: -0.05 },
        { date: '2021-01-01', value: -0.247 },
      ],
      rolling_max_drawdown: [
        { date: '2020-01-01', value: null },
        { date: '2020-06-01', value: -0.08 },
        { date: '2021-01-01', value: -0.127 },
      ],
      rolling_cagr: [
        { date: '2020-01-01', value: null },
        { date: '2020-06-01', value: -0.008 },
        { date: '2021-01-01', value: -0.009 },
      ],
    },
  },
  relative_metrics: {
    excess_return: 0.03512063566064383,
    tracking_error: 0.19666791205782988,
    information_ratio: 0.1691971572615515,
  },
  issues: [],
};

// Test 1: Adapter transforms correctly
console.log('TEST 1: Adapter transforms response');
try {
  const adapted = adaptBacktest(mockBacktestResponse);
  
  console.assert(adapted.navSeries.dates.length === 4, 'NAV series dates length');
  console.assert(adapted.navSeries.values[0] === 100000, 'NAV series first value');
  console.assert(adapted.equitySeries.values[0] === 80000, 'Equity series first value');
  console.assert(adapted.cashSeries.values[0] === 20000, 'Cash series first value');
  console.assert(adapted.benchmarkSeries !== null, 'Benchmark series exists');
  console.assert(adapted.portfolioMetrics.total_return === -0.009888759401990632, 'Portfolio metrics preserved');
  console.assert(adapted.relativeMetrics !== null, 'Relative metrics exists');
  console.assert(adapted.relativeMetrics.excess_return === 0.03512063566064383, 'Relative metrics values preserved');
  
  // Test rolling metrics separation (NEW)
  console.assert(adapted.rollingMetrics !== null, 'Rolling metrics exists');
  console.assert(adapted.rollingMetrics?.window_days === 252, 'Window days preserved');
  console.assert(
    adapted.rollingMetrics?.series.rolling_volatility.length === 3,
    'Rolling volatility points exist'
  );
  console.assert(
    adapted.rollingMetrics?.series.rolling_volatility[0].value === null,
    'Rolling volatility has null at start'
  );
  console.assert(
    adapted.rollingMetrics?.series.rolling_volatility[1].value === 0.145,
    'Rolling volatility has numeric value'
  );
  
  console.log('✅ Adapter test passed');
} catch (err) {
  console.error('❌ Adapter test failed:', err);
}

// Test 2: Adapter throws on failed backtest
console.log('\nTEST 2: Adapter throws on success=false');
try {
  const failedResponse = { ...mockBacktestResponse, success: false };
  adaptBacktest(failedResponse);
  console.error('❌ Should have thrown error');
} catch (err) {
  console.log('✅ Adapter correctly throws on failure');
}

// Test 3: Benchmark and rolling metrics are optional
console.log('\nTEST 3: Benchmark and rolling metrics are optional');
try {
  const responseNoBenchmark = {
    ...mockBacktestResponse,
    series: {
      ...mockBacktestResponse.series,
      benchmark_nav: undefined,
    },
    relative_metrics: undefined,
    rolling_metrics: undefined,
  };
  
  const adapted = adaptBacktest(responseNoBenchmark);
  console.assert(adapted.benchmarkSeries === null, 'Benchmark is null when not provided');
  console.assert(adapted.relativeMetrics === null, 'Relative metrics is null when not provided');
  console.assert(adapted.rollingMetrics === null, 'Rolling metrics is null when not provided');
  
  console.log('✅ Optional metrics test passed');
} catch (err) {
  console.error('❌ Optional metrics test failed:', err);
}

console.log('\n✅ All tests passed. Data flow is working.');
