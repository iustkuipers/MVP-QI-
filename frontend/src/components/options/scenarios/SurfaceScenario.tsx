/**
 * Surface Scenario component
 */

import React, { useState } from 'react';
import { OptionPosition, MarketSnapshot, optionsAPI } from '../../../api/options';
import styles from './SurfaceScenario.module.css';

type SurfaceType = 'spot-vol' | 'spot-time';

interface SurfaceScenarioProps {
  positions: OptionPosition[];
  market: MarketSnapshot;
  onOutput: (output: any) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
}

export function SurfaceScenario({
  positions,
  market,
  onOutput,
  onError,
  onLoading,
}: SurfaceScenarioProps) {
  const [surfaceType, setSurfaceType] = useState<SurfaceType>('spot-vol');
  const [spotMin, setSpotMin] = useState(150);
  const [spotMax, setSpotMax] = useState(220);
  const [spotSteps, setSpotSteps] = useState(3);
  const [volMin, setVolMin] = useState(0.15);
  const [volMax, setVolMax] = useState(0.35);
  const [volSteps, setVolSteps] = useState(3);
  const [timeMin, setTimeMin] = useState(5);
  const [timeMax, setTimeMax] = useState(30);
  const [timeSteps, setTimeSteps] = useState(3);
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);

  const generateRange = (min: number, max: number, steps: number): number[] => {
    const arr: number[] = [];
    const step = (max - min) / (steps - 1);
    for (let i = 0; i < steps; i++) {
      arr.push(min + step * i);
    }
    return arr;
  };

  const handleRun = async () => {
    if (!positions.length) {
      onError('Please add at least one option');
      return;
    }

    onLoading(true);
    onError('');

    try {
      const spots = generateRange(spotMin, spotMax, spotSteps);

      if (surfaceType === 'spot-vol') {
        const vols = generateRange(volMin, volMax, volSteps);
        const result = await optionsAPI.spotVolSurface(positions, market, today, spots, vols);
        onOutput(result);
      } else {
        const times = generateRange(timeMin, timeMax, timeSteps).map(Math.floor);
        const result = await optionsAPI.spotTimeSurface(
          positions,
          market,
          today,
          spots,
          times
        );
        onOutput(result);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Surface calculation failed');
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.subtitle}>Surface Parameters</h3>

      <div className={styles.field}>
        <label>Evaluation Date</label>
        <input type="date" value={today} onChange={(e) => setToday(e.target.value)} />
      </div>

      <div className={styles.surfaceType}>
        <label>Surface Type</label>
        <div className={styles.radioGroup}>
          <label className={styles.radio}>
            <input
              type="radio"
              value="spot-vol"
              checked={surfaceType === 'spot-vol'}
              onChange={(e) => setSurfaceType(e.target.value as SurfaceType)}
            />
            Spot × Vol
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              value="spot-time"
              checked={surfaceType === 'spot-time'}
              onChange={(e) => setSurfaceType(e.target.value as SurfaceType)}
            />
            Spot × Time
          </label>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label>Spot Min</label>
          <input
            type="number"
            value={spotMin}
            onChange={(e) => setSpotMin(parseFloat(e.target.value))}
          />
        </div>
        <div className={styles.field}>
          <label>Spot Max</label>
          <input
            type="number"
            value={spotMax}
            onChange={(e) => setSpotMax(parseFloat(e.target.value))}
          />
        </div>
        <div className={styles.field}>
          <label>Spot Steps</label>
          <input
            type="number"
            min="2"
            value={spotSteps}
            onChange={(e) => setSpotSteps(parseInt(e.target.value))}
          />
        </div>
      </div>

      {surfaceType === 'spot-vol' ? (
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Vol Min</label>
            <input
              type="number"
              step="0.01"
              value={volMin}
              onChange={(e) => setVolMin(parseFloat(e.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label>Vol Max</label>
            <input
              type="number"
              step="0.01"
              value={volMax}
              onChange={(e) => setVolMax(parseFloat(e.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label>Vol Steps</label>
            <input
              type="number"
              min="2"
              value={volSteps}
              onChange={(e) => setVolSteps(parseInt(e.target.value))}
            />
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Time Min (days)</label>
            <input
              type="number"
              value={timeMin}
              onChange={(e) => setTimeMin(parseInt(e.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label>Time Max (days)</label>
            <input
              type="number"
              value={timeMax}
              onChange={(e) => setTimeMax(parseInt(e.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label>Time Steps</label>
            <input
              type="number"
              min="2"
              value={timeSteps}
              onChange={(e) => setTimeSteps(parseInt(e.target.value))}
            />
          </div>
        </div>
      )}

      <button className={styles.runBtn} onClick={handleRun}>
        Generate Surface
      </button>
    </div>
  );
}
