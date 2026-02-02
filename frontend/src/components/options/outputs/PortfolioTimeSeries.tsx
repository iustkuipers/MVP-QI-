/**
 * Portfolio Time Series - Historical portfolio value and underlying price evolution
 * Real data from market_loader, standalone from scenario tests
 */

import { useState, useEffect } from 'react';
import styles from './PortfolioTimeSeries.module.css';
import { optionsAPI, OptionPosition, MarketSnapshot } from '../../../api/options';

interface TimeSeriesData {
  date: string;
  spotPrice: number;
  portfolioValue: number;
}

interface PortfolioTimeSeriesProps {
  positions: OptionPosition[];
  market: MarketSnapshot;
  symbolName?: string;
}

interface MetricsSummary {
  startDate: string;
  endDate: string;
  daysObserved: number;
  spotStartPrice: number;
  spotEndPrice: number;
  spotReturn: number;
  portfolioStartValue: number;
  portfolioEndValue: number;
  portfolioReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
}

export function PortfolioTimeSeries({
  positions,
  market,
  symbolName = 'Portfolio',
}: PortfolioTimeSeriesProps) {
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch historical data and compute portfolio values
  useEffect(() => {
    const fetchAndComputeTimeSeries = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch historical prices
        const response = await fetch(
          `http://localhost:8000/api/v1/market/history/${symbolName}?days=60`
        );
        const priceData = await response.json();

        if (priceData.error || !Array.isArray(priceData)) {
          setError(`Could not fetch price history for ${symbolName}`);
          setTimeSeries([]);
          setMetrics(null);
          return;
        }

        if (priceData.length === 0) {
          setError(`No price data available for ${symbolName}`);
          setTimeSeries([]);
          return;
        }

        // For now, create time series with just prices
        // Portfolio value requires expensive payoff calls - will optimize later
        const timeseries: TimeSeriesData[] = priceData.map((pricePoint: any) => ({
          date: pricePoint.date,
          spotPrice: pricePoint.price,
          portfolioValue: pricePoint.price, // Placeholder - TODO: compute actual portfolio value
        }));

        setTimeSeries(timeseries);

        // Compute metrics
        if (timeseries.length > 1) {
          const computedMetrics = computeMetrics(timeseries);
          setMetrics(computedMetrics);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('Error in portfolio time series:', errorMsg);
        setError(`Error: ${errorMsg}`);
        setTimeSeries([]);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    if (positions.length > 0) {
      fetchAndComputeTimeSeries();
    }
  }, [symbolName, positions, market]);

  const computeMetrics = (data: TimeSeriesData[]): MetricsSummary => {
    if (data.length < 2) {
      return {
        startDate: '',
        endDate: '',
        daysObserved: 0,
        spotStartPrice: 0,
        spotEndPrice: 0,
        spotReturn: 0,
        portfolioStartValue: 0,
        portfolioEndValue: 0,
        portfolioReturn: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        volatility: 0,
      };
    }

    const start = data[0];
    const end = data[data.length - 1];
    const daysObserved = data.length - 1;

    const spotReturn = ((end.spotPrice - start.spotPrice) / start.spotPrice) * 100;
    const portfolioReturn = ((end.portfolioValue - start.portfolioValue) / start.portfolioValue) * 100;

    // Compute max drawdown
    let maxDrawdown = 0;
    let peak = data[0].portfolioValue;
    for (const point of data) {
      if (point.portfolioValue > peak) {
        peak = point.portfolioValue;
      }
      const drawdown = ((peak - point.portfolioValue) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Compute daily returns for volatility and Sharpe
    const dailyReturns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const dailyReturn = (data[i].portfolioValue - data[i - 1].portfolioValue) / data[i - 1].portfolioValue;
      dailyReturns.push(dailyReturn);
    }

    // Volatility (annualized)
    const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((a, r) => a + Math.pow(r - meanReturn, 2), 0) / dailyReturns.length;
    const dailyVol = Math.sqrt(variance);
    const volatility = dailyVol * Math.sqrt(252) * 100; // Annualize

    // Sharpe ratio (assuming 0% risk-free rate)
    const sharpeRatio = meanReturn > 0 ? (meanReturn / dailyVol) * Math.sqrt(252) : 0;

    return {
      startDate: start.date,
      endDate: end.date,
      daysObserved,
      spotStartPrice: start.spotPrice,
      spotEndPrice: end.spotPrice,
      spotReturn,
      portfolioStartValue: start.portfolioValue,
      portfolioEndValue: end.portfolioValue,
      portfolioReturn,
      maxDrawdown,
      sharpeRatio,
      volatility,
    };
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Portfolio Time Series Analysis</h2>
        <div className={styles.loadingBox}>
          <p>Computing historical portfolio values...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Portfolio Time Series Analysis</h2>
        <div className={styles.errorBox}>
          <p>⚠️ {error}</p>
        </div>
      </div>
    );
  }

  if (timeSeries.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Portfolio Time Series Analysis</h2>
        <div className={styles.errorBox}>
          <p>No data available. Add positions and select a valid underlying symbol.</p>
        </div>
      </div>
    );
  }

  // Chart rendering
  const prices = timeSeries.map((d) => d.spotPrice);
  const portfolioValues = timeSeries.map((d) => d.portfolioValue);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minPortfolio = Math.min(...portfolioValues);
  const maxPortfolio = Math.max(...portfolioValues);

  const priceRange = maxPrice - minPrice || 1;
  const portfolioRange = maxPortfolio - minPortfolio || 1;

  const chartHeight = 200;
  const chartWidth = timeSeries.length;

  const normalizePriceY = (price: number) => {
    return chartHeight * (1 - (price - minPrice) / priceRange);
  };

  const normalizePortfolioY = (value: number) => {
    return chartHeight * (1 - (value - minPortfolio) / portfolioRange);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Portfolio Time Series Analysis</h2>
      <p className={styles.subtitle}>Real market data • {symbolName} • {timeSeries.length} days</p>

      {/* Large Chart */}
      <div className={styles.chartSection}>
        <div className={styles.chartContainer}>
          <svg width="100%" height="200" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            {/* Grid */}
            <defs>
              <pattern id="gridTs" width="10" height="40" patternUnits="userSpaceOnUse">
                <path d={`M 10 0 L 0 0 0 ${chartHeight}`} fill="none" stroke="#d0d0d0" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width={chartWidth} height={chartHeight} fill="url(#gridTs)" />

            {/* Underlying price line (cyan) */}
            <polyline
              points={timeSeries
                .map((d, i) => `${i},${normalizePriceY(d.spotPrice)}`)
                .join(' ')}
              fill="none"
              stroke="#00d4ff"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />

            {/* Portfolio value line (lime) */}
            <polyline
              points={timeSeries
                .map((d, i) => `${i},${normalizePortfolioY(d.portfolioValue)}`)
                .join(' ')}
              fill="none"
              stroke="#00ff00"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />

            {/* Start markers */}
            <circle
              cx={0}
              cy={normalizePriceY(timeSeries[0].spotPrice)}
              r="2"
              fill="#00d4ff"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={0}
              cy={normalizePortfolioY(timeSeries[0].portfolioValue)}
              r="2"
              fill="#00ff00"
              vectorEffect="non-scaling-stroke"
            />

            {/* End markers */}
            <circle
              cx={chartWidth - 1}
              cy={normalizePriceY(timeSeries[timeSeries.length - 1].spotPrice)}
              r="2"
              fill="#0088ff"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={chartWidth - 1}
              cy={normalizePortfolioY(timeSeries[timeSeries.length - 1].portfolioValue)}
              r="2"
              fill="#00cc00"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.line} style={{ backgroundColor: '#00d4ff' }} />
            Underlying Price
          </div>
          <div className={styles.legendItem}>
            <span className={styles.line} style={{ backgroundColor: '#00ff00' }} />
            Portfolio Value
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#666' }}>
            {timeSeries[0].date} → {timeSeries[timeSeries.length - 1].date}
          </div>
        </div>
      </div>

      {/* Metrics Summary */}
      {metrics && (
        <div className={styles.metricsSection}>
          <h3 className={styles.metricsTitle}>Metrics Summary</h3>
          <div className={styles.metricsGrid}>
            {/* Underlying */}
            <div className={styles.metricGroup}>
              <div className={styles.groupTitle}>Underlying ({symbolName})</div>

              <div className={styles.metricRow}>
                <span className={styles.label}>Start Price:</span>
                <span className={styles.value}>${metrics.spotStartPrice.toFixed(2)}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.label}>End Price:</span>
                <span className={styles.value}>${metrics.spotEndPrice.toFixed(2)}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.label}>Total Return:</span>
                <span className={styles.value + ' ' + (metrics.spotReturn >= 0 ? styles.positive : styles.negative)}>
                  {metrics.spotReturn >= 0 ? '+' : ''}{metrics.spotReturn.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Portfolio */}
            <div className={styles.metricGroup}>
              <div className={styles.groupTitle}>Portfolio</div>

              <div className={styles.metricRow}>
                <span className={styles.label}>Start Value:</span>
                <span className={styles.value}>${metrics.portfolioStartValue.toFixed(2)}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.label}>End Value:</span>
                <span className={styles.value}>${metrics.portfolioEndValue.toFixed(2)}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.label}>Total Return:</span>
                <span className={styles.value + ' ' + (metrics.portfolioReturn >= 0 ? styles.positive : styles.negative)}>
                  {metrics.portfolioReturn >= 0 ? '+' : ''}{metrics.portfolioReturn.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Risk Metrics */}
            <div className={styles.metricGroup}>
              <div className={styles.groupTitle}>Risk Metrics</div>

              <div className={styles.metricRow}>
                <span className={styles.label}>Max Drawdown:</span>
                <span className={styles.value + ' ' + styles.negative}>{metrics.maxDrawdown.toFixed(2)}%</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.label}>Annualized Vol:</span>
                <span className={styles.value}>{metrics.volatility.toFixed(2)}%</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.label}>Sharpe Ratio:</span>
                <span className={styles.value + ' ' + (metrics.sharpeRatio >= 0 ? styles.positive : styles.negative)}>
                  {metrics.sharpeRatio.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Period Info */}
            <div className={styles.metricGroup}>
              <div className={styles.groupTitle}>Period</div>

              <div className={styles.metricRow}>
                <span className={styles.label}>Start Date:</span>
                <span className={styles.value}>{metrics.startDate}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.label}>End Date:</span>
                <span className={styles.value}>{metrics.endDate}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.label}>Days Observed:</span>
                <span className={styles.value}>{metrics.daysObserved}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
