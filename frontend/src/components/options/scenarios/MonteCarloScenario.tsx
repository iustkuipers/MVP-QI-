/**
 * Monte Carlo Scenario component
 */

import React, { useState } from 'react';
import { OptionPosition, MarketSnapshot, optionsAPI } from '../../../api/options';
import styles from './MonteCarloScenario.module.css';

interface MonteCarloScenarioProps {
  positions: OptionPosition[];
  market: MarketSnapshot;
  onOutput: (output: any) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
}

export function MonteCarloScenario({
  positions,
  market,
  onOutput,
  onError,
  onLoading,
}: MonteCarloScenarioProps) {
  const [horizon_days, setHorizonDays] = useState(30);
  const [n_sims, setNSims] = useState(10000);
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [seed, setSeed] = useState<number | undefined>();

  const handleRun = async () => {
    if (!positions.length) {
      onError('Please add at least one option');
      return;
    }

    onLoading(true);
    onError('');

    try {
      const result = await optionsAPI.monteCarlo(
        positions,
        market,
        today,
        horizon_days,
        n_sims,
        seed
      );
      onOutput(result);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Monte Carlo failed');
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.subtitle}>Monte Carlo Parameters</h3>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>Evaluation Date</label>
          <input
            type="date"
            value={today}
            onChange={(e) => setToday(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>Horizon (days)</label>
          <input
            type="number"
            min="1"
            value={horizon_days}
            onChange={(e) => setHorizonDays(parseInt(e.target.value))}
          />
        </div>

        <div className={styles.field}>
          <label>Simulations</label>
          <input
            type="number"
            min="100"
            step="100"
            value={n_sims}
            onChange={(e) => setNSims(parseInt(e.target.value))}
          />
        </div>
      </div>

      <button className={styles.advancedToggle} onClick={() => setShowAdvanced(!showAdvanced)}>
        {showAdvanced ? '▼' : '▶'} Advanced Options
      </button>

      {showAdvanced && (
        <div className={styles.advancedFields}>
          <div className={styles.field}>
            <label>Random Seed (optional)</label>
            <input
              type="number"
              value={seed || ''}
              onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Leave empty for random"
            />
            <span className={styles.hint}>For reproducible results</span>
          </div>
        </div>
      )}

      <button className={styles.runBtn} onClick={handleRun}>
        Run Monte Carlo
      </button>
    </div>
  );
}
