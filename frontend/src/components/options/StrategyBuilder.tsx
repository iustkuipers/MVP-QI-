/**
 * Strategy Builder component - Define option positions
 */

import React from 'react';
import { OptionPosition } from '../../../api/options';
import styles from './StrategyBuilder.module.css';

interface StrategyBuilderProps {
  positions: OptionPosition[];
  onPositionsChange: (positions: OptionPosition[]) => void;
}

export function StrategyBuilder({ positions, onPositionsChange }: StrategyBuilderProps) {
  const [positionType, setPositionType] = React.useState<'option' | 'stock'>('option');

  const handleAddPosition = () => {
    if (positionType === 'option') {
      const newPosition: OptionPosition = {
        symbol: 'AAPL',
        type: 'call',
        strike: 100,
        expiry: new Date().toISOString().split('T')[0],
        quantity: 1,
      };
      onPositionsChange([...positions, newPosition]);
    } else {
      const newPosition: OptionPosition = {
        symbol: 'AAPL',
        type: 'stock',
        quantity: 100,
      };
      onPositionsChange([...positions, newPosition]);
    }
  };

  const handleUpdatePosition = (index: number, updates: Partial<OptionPosition>) => {
    const updated = [...positions];
    updated[index] = { ...updated[index], ...updates };
    onPositionsChange(updated);
  };

  const handleRemovePosition = (index: number) => {
    onPositionsChange(positions.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Option Strategy</h2>
      
      <div className={styles.positionsList}>
        {positions.map((pos, idx) => (
          <div key={idx} className={styles.positionItem}>
            <div className={styles.positionGrid}>
              <div className={styles.field}>
                <label>Symbol</label>
                <input
                  type="text"
                  value={pos.symbol}
                  onChange={(e) => handleUpdatePosition(idx, { symbol: e.target.value })}
                  placeholder="AAPL"
                />
              </div>

              <div className={styles.field}>
                <label>Type</label>
                <select
                  value={pos.type || 'call'}
                  onChange={(e) => handleUpdatePosition(idx, { type: e.target.value as 'call' | 'put' | 'stock' })}
                >
                  <option value="call">Call</option>
                  <option value="put">Put</option>
                  <option value="stock">Stock</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Entry Date</label>
                <input
                  type="date"
                  value={pos.entry_date || ''}
                  onChange={(e) => handleUpdatePosition(idx, { entry_date: e.target.value })}
                />
              </div>

              {(pos.type === 'call' || pos.type === 'put') && (
                <>
                  <div className={styles.field}>
                    <label>Strike</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pos.strike || ''}
                      onChange={(e) => handleUpdatePosition(idx, { strike: parseFloat(e.target.value) })}
                      placeholder="100"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Expiry</label>
                    <input
                      type="date"
                      value={pos.expiry || ''}
                      onChange={(e) => handleUpdatePosition(idx, { expiry: e.target.value })}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Premium</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pos.entry_price ?? ''}
                      onChange={(e) => handleUpdatePosition(idx, { entry_price: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="Optional"
                    />
                  </div>
                </>
              )}

              <div className={styles.field}>
                <label>Quantity</label>
                <input
                  type="number"
                  step={pos.type === 'stock' ? '1' : '0.01'}
                  value={pos.quantity}
                  onChange={(e) => handleUpdatePosition(idx, { quantity: parseFloat(e.target.value) })}
                  placeholder="1"
                />
              </div>

              <div className={styles.field}>
                <label>&nbsp;</label>
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemovePosition(idx)}
                  title="Remove position"
                >
                  ❌
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.addButtonGroup}>
        <select 
          value={positionType} 
          onChange={(e) => setPositionType(e.target.value as 'option' | 'stock')}
          className={styles.typeSelect}
        >
          <option value="option">Option</option>
          <option value="stock">Stock</option>
        </select>
        <button className={styles.addBtn} onClick={handleAddPosition}>
          + Add {positionType === 'option' ? 'Option' : 'Stock'}
        </button>
      </div>
    </div>
  );
}
