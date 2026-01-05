/**
 * BacktestForm - Controlled form component
 * State is managed by parent (BacktestPage)
 */

import React from 'react';
import { BacktestRequest } from '../../api/types';

interface Position {
  id: string;
  ticker: string;
  weight: string;
}

interface BacktestFormProps {
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  initialCash: string;
  onInitialCashChange: (value: string) => void;
  positions: Position[];
  onPositionsChange: (positions: Position[]) => void;
  riskFreeRate: string;
  onRiskFreeRateChange: (value: string) => void;
  benchmarkTicker: string;
  onBenchmarkTickerChange: (value: string) => void;
  onSubmit: (payload: BacktestRequest) => void;
  loading: boolean;
}

export function BacktestForm({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  initialCash,
  onInitialCashChange,
  positions,
  onPositionsChange,
  riskFreeRate,
  onRiskFreeRateChange,
  benchmarkTicker,
  onBenchmarkTickerChange,
  onSubmit,
  loading,
}: BacktestFormProps) {
  const addPosition = () => {
    const newId = String(Math.max(...positions.map(p => Number(p.id)), 0) + 1);
    onPositionsChange([...positions, { id: newId, ticker: '', weight: '0' }]);
  };

  const removePosition = (id: string) => {
    if (positions.length > 1) {
      onPositionsChange(positions.filter(p => p.id !== id));
    }
  };

  const updatePosition = (id: string, ticker: string, weight: string) => {
    onPositionsChange(
      positions.map(p => (p.id === id ? { id, ticker, weight } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: BacktestRequest = {
      start_date: startDate,
      end_date: endDate,
      initial_cash: Number(initialCash),
      positions: positions
        .filter(p => p.ticker.trim())
        .map(p => ({
          ticker: p.ticker,
          weight: Number(p.weight),
        })),
      risk_free_rate: Number(riskFreeRate),
      benchmark_ticker: benchmarkTicker || undefined,
      rebalance: 'none',
      fractional_shares: false,
      risk_free_compounding: 'daily',
      data_provider: 'mock',
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.formTitle}>Backtest Parameters</h2>

      {/* Date Range */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Date Range</h3>
        <div style={styles.row}>
          <label style={styles.label}>
            Start Date
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              disabled={loading}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            End Date
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              disabled={loading}
              style={styles.input}
            />
          </label>
        </div>
      </div>

      {/* Capital */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Capital</h3>
        <label style={styles.label}>
          Initial Cash ($)
          <input
            type="number"
            value={initialCash}
            onChange={(e) => onInitialCashChange(e.target.value)}
            disabled={loading}
            style={styles.input}
          />
        </label>
      </div>

      {/* Positions */}
      <div style={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={styles.sectionTitle}>Positions</h3>
          <button
            type="button"
            onClick={addPosition}
            disabled={loading}
            style={styles.addButton}
          >
            + Add
          </button>
        </div>
        <div style={styles.positionList}>
          {positions.map((pos) => (
            <div key={pos.id} style={styles.positionRow}>
              <input
                type="text"
                placeholder="Ticker"
                value={pos.ticker}
                onChange={(e) => updatePosition(pos.id, e.target.value, pos.weight)}
                disabled={loading}
                style={styles.positionInput}
              />
              <input
                type="number"
                placeholder="Weight"
                value={pos.weight}
                onChange={(e) => updatePosition(pos.id, pos.ticker, e.target.value)}
                disabled={loading}
                step="0.01"
                min="0"
                max="1"
                style={styles.positionInput}
              />
              <button
                type="button"
                onClick={() => removePosition(pos.id)}
                disabled={loading || positions.length <= 1}
                style={styles.removeButton}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Benchmark & Risk */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Benchmark & Risk</h3>
        <div style={styles.row}>
          <label style={styles.label}>
            Benchmark Ticker
            <input
              type="text"
              value={benchmarkTicker}
              onChange={(e) => onBenchmarkTickerChange(e.target.value)}
              disabled={loading}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Risk-Free Rate
            <input
              type="number"
              value={riskFreeRate}
              onChange={(e) => onRiskFreeRateChange(e.target.value)}
              disabled={loading}
              step="0.01"
              style={styles.input}
            />
          </label>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          ...styles.button,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Running...' : 'Run Backtest'}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '24px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  formTitle: {
    marginTop: 0,
    marginBottom: '24px',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '12px',
    fontSize: '14px',
    fontWeight: '500',
  },
  input: {
    marginTop: '6px',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  positionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  positionRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 40px',
    gap: '8px',
    alignItems: 'center',
  },
  positionInput: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  addButton: {
    padding: '6px 12px',
    backgroundColor: '#e3f2fd',
    border: '1px solid #2196F3',
    borderRadius: '4px',
    color: '#2196F3',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  removeButton: {
    padding: '6px 12px',
    backgroundColor: '#ffebee',
    border: '1px solid #f44336',
    borderRadius: '4px',
    color: '#f44336',
    cursor: 'pointer',
    fontSize: '14px',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
