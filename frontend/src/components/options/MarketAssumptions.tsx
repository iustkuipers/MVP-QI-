/**
 * Market Assumptions component
 */

import React from 'react';
import { MarketSnapshot } from '../../../api/options';
import styles from './MarketAssumptions.module.css';

interface MarketAssumptionsProps {
  market: MarketSnapshot;
  onMarketChange: (market: MarketSnapshot) => void;
}

export function MarketAssumptions({ market, onMarketChange }: MarketAssumptionsProps) {
  const handleUpdate = (field: keyof MarketSnapshot, value: number) => {
    onMarketChange({
      ...market,
      [field]: value,
    });
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Market Assumptions</h2>
      
      <div className={styles.grid}>
        <div className={styles.field}>
          <label>Volatility</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="2"
            value={market.volatility}
            onChange={(e) => handleUpdate('volatility', parseFloat(e.target.value))}
            placeholder="0.25"
          />
          <span className={styles.hint}>{(market.volatility * 100).toFixed(1)}%</span>
        </div>

        <div className={styles.field}>
          <label>Risk-Free Rate</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={market.rate}
            onChange={(e) => handleUpdate('rate', parseFloat(e.target.value))}
            placeholder="0.03"
          />
          <span className={styles.hint}>{(market.rate * 100).toFixed(2)}%</span>
        </div>

        <div className={styles.field}>
          <label>Dividend Yield</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={market.dividend_yield || 0}
            onChange={(e) => handleUpdate('dividend_yield', parseFloat(e.target.value))}
            placeholder="0.00"
          />
          <span className={styles.hint}>{((market.dividend_yield || 0) * 100).toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}
