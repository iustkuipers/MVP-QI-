/**
 * SymbolPicker component - Select the underlying asset
 */

import React from 'react';
import styles from './SymbolPicker.module.css';

interface SymbolPickerProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
}

export function SymbolPicker({ symbol, onSymbolChange }: SymbolPickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSymbolChange(e.target.value.toUpperCase());
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Underlying Instrument</h3>
      
      <div className={styles.field}>
        <label htmlFor="symbol">Symbol</label>
        <input
          id="symbol"
          type="text"
          value={symbol}
          onChange={handleChange}
          placeholder="e.g., AAPL"
          maxLength={10}
        />
        <p className={styles.hint}>This symbol is used for all options, underlying price, and buy & hold comparison</p>
      </div>
    </div>
  );
}
