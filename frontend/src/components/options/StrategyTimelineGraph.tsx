/**
 * StrategyTimelineGraph component - Display portfolio performance over time
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import styles from './StrategyTimelineGraph.module.css';

export interface TimelineData {
  dates: string[];
  underlying: number[];
  portfolio_total: number[];
  portfolio_options: number[];
  buy_and_hold: number[];
  initial_cost: number;
  initial_spot: number;
  instruments: { [key: string]: number[] };
  markers: Array<{ date: string; label: string }>;
}

interface StrategyTimelineGraphProps {
  data: TimelineData;
  utilityType?: 'risk-neutral' | 'crra' | 'cara';
  crraGamma?: number;
  caraA?: number;
}

/**
 * Compute simple preference ordering based on utility
 * Risk-neutral: compare final values
 * CRRA/CARA: compare Sharpe-like metrics (mean return / volatility)
 */
function computePreferenceOrdering(
  portfolio: number[],
  buyAndHold: number[],
  utilityType: string = 'risk-neutral',
  crraGamma: number = 2,
  caraA: number = 0.1
): 'dominates' | 'dominated' | 'inconclusive' {
  if (portfolio.length === 0 || buyAndHold.length === 0) {
    return 'inconclusive';
  }

  const portfolioFinal = portfolio[portfolio.length - 1];
  const buyHoldFinal = buyAndHold[buyAndHold.length - 1];

  // Compute returns
  const portfolioReturn = (portfolioFinal - portfolio[0]) / portfolio[0];
  const buyHoldReturn = (buyHoldFinal - buyAndHold[0]) / buyAndHold[0];

  // Compute volatility (simple std of returns over windows)
  const getVolatility = (values: number[]) => {
    const returns = [];
    for (let i = 1; i < values.length; i++) {
      returns.push((values[i] - values[i - 1]) / values[i - 1]);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  };

  const portfolioVol = getVolatility(portfolio);
  const buyHoldVol = getVolatility(buyAndHold);

  // Simple dominance heuristic
  if (utilityType === 'risk-neutral') {
    // Risk-neutral: higher return dominates
    if (portfolioReturn > buyHoldReturn * 1.01) {
      return 'dominates';
    } else if (portfolioReturn < buyHoldReturn * 0.99) {
      return 'dominated';
    }
  } else if (utilityType === 'crra' || utilityType === 'cara') {
    // Risk-averse: prefer higher return AND lower volatility
    const portfolioScore = portfolioReturn - (crraGamma || 2) * 0.5 * Math.pow(portfolioVol, 2);
    const buyHoldScore = buyHoldReturn - (crraGamma || 2) * 0.5 * Math.pow(buyHoldVol, 2);

    if (portfolioScore > buyHoldScore * 1.01) {
      return 'dominates';
    } else if (portfolioScore < buyHoldScore * 0.99) {
      return 'dominated';
    }
  }

  return 'inconclusive';
}

export function StrategyTimelineGraph({ data, utilityType = 'risk-neutral', crraGamma = 2, caraA = 0.1 }: StrategyTimelineGraphProps) {
  if (!data.dates || data.dates.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyState}>No data available</p>
      </div>
    );
  }

  // Compute preference ordering
  const ordering = computePreferenceOrdering(
    data.portfolio_total,
    data.buy_and_hold,
    utilityType,
    crraGamma,
    caraA
  );

  // Transform data for recharts
  const chartData = data.dates.map((date, index) => ({
    date,
    underlying: data.underlying[index] || 0,
    portfolio: data.portfolio_total[index] || 0,
    buyAndHold: data.buy_and_hold[index] || 0,
  }));

  return (
    <div className={styles.container}>
      <div className={styles.graphContainer}>
        <h3 className={styles.title}>Strategy Performance Over Time</h3>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval={Math.floor(data.dates.length / 6)}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Value ($)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: any) => value?.toFixed(2)}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="underlying" 
              stroke="#8884d8" 
              dot={false}
              name="Underlying Price"
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="portfolio" 
              stroke="#82ca9d" 
              dot={false}
              name="Portfolio (Options + Stock)"
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="buyAndHold" 
              stroke="#ffc658" 
              dot={false}
              name="Buy & Hold (Stock Only)"
              isAnimationActive={false}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Initial Cost:</span>
            <span className={styles.statValue}>${data.initial_cost?.toFixed(2)}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Initial Spot:</span>
            <span className={styles.statValue}>${data.initial_spot?.toFixed(2)}</span>
          </div>
          {data.portfolio_total && data.portfolio_total.length > 0 && (
            <>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Final Portfolio Value:</span>
                <span className={styles.statValue}>
                  ${data.portfolio_total[data.portfolio_total.length - 1]?.toFixed(2)}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Final Buy & Hold Value:</span>
                <span className={styles.statValue}>
                  ${data.buy_and_hold[data.buy_and_hold.length - 1]?.toFixed(2)}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Difference:</span>
                <span className={styles.statValue}>
                  ${(data.portfolio_total[data.portfolio_total.length - 1] - data.buy_and_hold[data.buy_and_hold.length - 1])?.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>

        <div className={styles.preferenceOrdering}>
          <h4 className={styles.preferenceTitle}>Preference Ordering (given selected utility)</h4>
          <ul className={styles.preferenceList}>
            <li className={ordering === 'dominates' ? styles.active : ''}>
              ✓ Dominates Buy & Hold
            </li>
            <li className={ordering === 'dominated' ? styles.active : ''}>
              ✗ Dominated by Buy & Hold
            </li>
            <li className={ordering === 'inconclusive' ? styles.active : ''}>
              – Inconclusive
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
