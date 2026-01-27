/**
 * Market Context - Underlying price history and current state
 */

import React, { useMemo, useState, useEffect } from 'react';
import styles from './MarketContext.module.css';

interface MarketContextProps {
  spot: number;
  volatility: number;
  rate: number;
  dividendYield: number;
  today: string;
  expiryDate: string;
  symbolName?: string;
}

interface HistoricalDataPoint {
  date: string;
  price: number;
}

export function MarketContext({
  spot,
  volatility,
  rate,
  dividendYield,
  today,
  expiryDate,
  symbolName = 'Underlying',
}: MarketContextProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch REAL historical data ONLY - no fallback to mock
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:8000/api/v1/market/history/${symbolName}?days=60`);
        const data = await response.json();
        
        // Check if response is an error
        if (data.error) {
          setError(`Symbol not found: ${symbolName}`);
          setHistoricalData([]);
        } else if (Array.isArray(data) && data.length > 0) {
          setHistoricalData(data);
        } else {
          setError(`No data available for ${symbolName}`);
          setHistoricalData([]);
        }
      } catch (err) {
        setError(`Could not fetch data for ${symbolName}`);
        setHistoricalData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [symbolName]);

  // Calculate days to expiry
  const todayDate = new Date(today);
  const expiryDateObj = new Date(expiryDate);
  const daysToExpiry = Math.ceil((expiryDateObj.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

  // If no real data, show error state ONLY
  if (error || historicalData.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Market Context: {symbolName}</h3>

        {/* Current Market State */}
        <div className={styles.metrics}>
          <div className={styles.metricBox}>
            <div className={styles.metricLabel}>Current Spot</div>
            <div className={styles.metricValue}>${spot.toFixed(2)}</div>
          </div>
          <div className={styles.metricBox}>
            <div className={styles.metricLabel}>Volatility</div>
            <div className={styles.metricValue}>{(volatility * 100).toFixed(1)}%</div>
          </div>
          <div className={styles.metricBox}>
            <div className={styles.metricLabel}>Risk-Free Rate</div>
            <div className={styles.metricValue}>{(rate * 100).toFixed(2)}%</div>
          </div>
          <div className={styles.metricBox}>
            <div className={styles.metricLabel}>Days to Expiry</div>
            <div className={styles.metricValue}>{daysToExpiry}</div>
          </div>
        </div>

        {/* Error or Loading State */}
        {loading ? (
          <div className={styles.errorBox}>
            <p>Loading price history...</p>
          </div>
        ) : (
          <div className={styles.errorBox}>
            <p>⚠️ {error}</p>
            <p style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
              Check the symbol and try again.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // REAL DATA - Show full chart
  // ==========================================

  // Find min/max for scaling
  const prices = historicalData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const chartHeight = 80;
  const chartWidth = historicalData.length;

  const normalizePrice = (price: number) => {
    return chartHeight * (1 - (price - minPrice) / priceRange);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Market Context: {symbolName}</h3>

      {/* Current Market State */}
      <div className={styles.metrics}>
        <div className={styles.metricBox}>
          <div className={styles.metricLabel}>Current Spot</div>
          <div className={styles.metricValue}>${spot.toFixed(2)}</div>
        </div>
        <div className={styles.metricBox}>
          <div className={styles.metricLabel}>Volatility</div>
          <div className={styles.metricValue}>{(volatility * 100).toFixed(1)}%</div>
        </div>
        <div className={styles.metricBox}>
          <div className={styles.metricLabel}>Risk-Free Rate</div>
          <div className={styles.metricValue}>{(rate * 100).toFixed(2)}%</div>
        </div>
        <div className={styles.metricBox}>
          <div className={styles.metricLabel}>Days to Expiry</div>
          <div className={styles.metricValue}>{daysToExpiry}</div>
        </div>
      </div>

      {/* Price History Chart */}
      <div className={styles.chartSection}>
        <div className={styles.chartLabel}>
          Price History (60 days) {loading && <span style={{ fontSize: '10px', color: '#666' }}> · loading...</span>}
        </div>
        <div className={styles.miniChart}>
          <svg width="100%" height="80" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="5" height="20" patternUnits="userSpaceOnUse">
                <path d={`M 5 0 L 0 0 0 ${chartHeight}`} fill="none" stroke="#2a2a2a" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />

            {/* Price line */}
            <polyline
              points={historicalData
                .map((d, i) => `${i},${normalizePrice(d.price)}`)
                .join(' ')}
              fill="none"
              stroke="#00d4ff"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />

            {/* Current price point */}
            <circle
              cx={historicalData.length - 1}
              cy={normalizePrice(spot)}
              r="2"
              fill="#00ff00"
              vectorEffect="non-scaling-stroke"
            />

            {/* Min/Max price lines */}
            <line
              x1="0"
              y1={normalizePrice(minPrice)}
              x2={chartWidth}
              y2={normalizePrice(minPrice)}
              stroke="#666"
              strokeWidth="0.5"
              strokeDasharray="2,2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="0"
              y1={normalizePrice(maxPrice)}
              x2={chartWidth}
              y2={normalizePrice(maxPrice)}
              stroke="#666"
              strokeWidth="0.5"
              strokeDasharray="2,2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className={styles.chartLegend}>
            <span>
              <span className={styles.dot} style={{ backgroundColor: '#00d4ff' }} />
              Price
            </span>
            <span>
              <span className={styles.dot} style={{ backgroundColor: '#00ff00' }} />
              Today
            </span>
            <span style={{ fontSize: '10px', color: '#666' }}>
              {historicalData.length > 0 ? '(Real data)' : '(Mock data)'}
            </span>
          </div>
        </div>
      </div>

      {/* Range Summary */}
      <div className={styles.rangeSummary}>
        <div className={styles.rangeItem}>
          <span>High:</span>
          <span>${maxPrice.toFixed(2)}</span>
        </div>
        <div className={styles.rangeItem}>
          <span>Low:</span>
          <span>${minPrice.toFixed(2)}</span>
        </div>
        <div className={styles.rangeItem}>
          <span>vs Low:</span>
          <span className={styles.positive}>+{(((spot - minPrice) / minPrice) * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
