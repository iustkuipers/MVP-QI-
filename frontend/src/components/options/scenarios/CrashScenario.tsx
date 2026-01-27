/**
 * Crash Scenario component
 */

import React, { useState } from 'react';
import { OptionPosition, MarketSnapshot, optionsAPI } from '../../../api/options';
import styles from './CrashScenario.module.css';

interface CrashScenarioProps {
  positions: OptionPosition[];
  market: MarketSnapshot;
  onOutput: (output: any) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
}

export function CrashScenario({
  positions,
  market,
  onOutput,
  onError,
  onLoading,
}: CrashScenarioProps) {
  const [crashes, setCrashes] = useState<number[]>([-0.15, -0.25]);
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);
  const [crashInput, setCrashInput] = useState('-0.15');

  const handleAddCrash = () => {
    const crash = parseFloat(crashInput);
    if (!isNaN(crash) && !crashes.includes(crash)) {
      setCrashes([...crashes, crash].sort());
      setCrashInput('-0.15');
    }
  };

  const handleRemoveCrash = (idx: number) => {
    setCrashes(crashes.filter((_, i) => i !== idx));
  };

  const handleRun = async () => {
    if (!positions.length) {
      onError('Please add at least one option');
      return;
    }

    onLoading(true);
    onError('');

    try {
      const result = await optionsAPI.crashScenario(positions, market, today, crashes);
      onOutput(result);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Crash scenario failed');
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.subtitle}>Crash Stress Parameters</h3>

      <div className={styles.field}>
        <label>Evaluation Date</label>
        <input type="date" value={today} onChange={(e) => setToday(e.target.value)} />
      </div>

      <div className={styles.crashControls}>
        <div className={styles.field}>
          <label>Crash Size (%)</label>
          <div className={styles.crashInput}>
            <input
              type="number"
              step="0.01"
              value={crashInput}
              onChange={(e) => setCrashInput(e.target.value)}
              placeholder="-0.15"
            />
            <button className={styles.addCrashBtn} onClick={handleAddCrash}>
              Add
            </button>
          </div>
        </div>

        <div className={styles.crashList}>
          {crashes.map((crash, idx) => (
            <div key={idx} className={styles.crashTag}>
              {(crash * 100).toFixed(1)}%
              <button
                className={styles.removeTag}
                onClick={() => handleRemoveCrash(idx)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <button className={styles.runBtn} onClick={handleRun}>
        Run Crash Scenario
      </button>
    </div>
  );
}
