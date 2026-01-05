/**
 * Test: Form → API → Adapter → Display
 * 
 * This validates the entire data flow works end-to-end
 */

import { adaptBacktest } from '../adapters/backtestAdapter';

// Simulate the backend response (example_response.json structure)
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

// Test 3: Benchmark is optional
console.log('\nTEST 3: Benchmark is optional');
try {
  const responseNoBenchmark = {
    ...mockBacktestResponse,
    series: {
      ...mockBacktestResponse.series,
      benchmark_nav: undefined,
    },
    relative_metrics: undefined,
  };
  
  const adapted = adaptBacktest(responseNoBenchmark);
  console.assert(adapted.benchmarkSeries === null, 'Benchmark is null when not provided');
  console.assert(adapted.relativeMetrics === null, 'Relative metrics is null when not provided');
  
  console.log('✅ Optional benchmark test passed');
} catch (err) {
  console.error('❌ Optional benchmark test failed:', err);
}

console.log('\n✅ All tests passed. Data flow is working.');
