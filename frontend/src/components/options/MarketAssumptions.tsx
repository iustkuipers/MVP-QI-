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
  const handleUpdate = (field: keyof MarketSnapshot, value: number | string) => {
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
          <span className={styles.note}>
            Enters both discounting and opportunity cost
          </span>
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

      <div className={styles.utilitySection}>
        <h3 className={styles.subtitle}>Utility Specification</h3>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="utility_type"
              value="risk-neutral"
              checked={(market.utility_type || 'risk-neutral') === 'risk-neutral'}
              onChange={(e) => handleUpdate('utility_type', e.target.value)}
            />
            Risk-neutral
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="utility_type"
              value="crra"
              checked={market.utility_type === 'crra'}
              onChange={(e) => handleUpdate('utility_type', e.target.value)}
            />
            CRRA (γ =
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={market.crra_gamma || 2}
              onChange={(e) => handleUpdate('crra_gamma', parseFloat(e.target.value))}
              disabled={market.utility_type !== 'crra'}
              style={{width: '50px', marginLeft: '4px'}}
            />
            )
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="utility_type"
              value="cara"
              checked={market.utility_type === 'cara'}
              onChange={(e) => handleUpdate('utility_type', e.target.value)}
            />
            CARA (a =
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={market.cara_a || 0.1}
              onChange={(e) => handleUpdate('cara_a', parseFloat(e.target.value))}
              disabled={market.utility_type !== 'cara'}
              style={{width: '50px', marginLeft: '4px'}}
            />
            )
          </label>
        </div>
        <p className={styles.note}>
          Strategy comparison is based on expected utility under the selected utility specification.
        </p>
      </div>
    </div>
  );
}
