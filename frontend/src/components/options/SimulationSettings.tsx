/**
 * SimulationSettings component - Date range and simulation controls
 */

import React from 'react';
import styles from './SimulationSettings.module.css';

export interface SimulationParams {
  startDate: string;
  endDate: string;
}

interface SimulationSettingsProps {
  params: SimulationParams;
  onParamsChange: (params: SimulationParams) => void;
}

export function SimulationSettings({ params, onParamsChange }: SimulationSettingsProps) {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({
      ...params,
      startDate: e.target.value,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({
      ...params,
      endDate: e.target.value,
    });
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Simulation Period</h3>
      
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="start-date">Start Date</label>
          <input
            id="start-date"
            type="date"
            value={params.startDate}
            onChange={handleStartDateChange}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="end-date">End Date</label>
          <input
            id="end-date"
            type="date"
            value={params.endDate}
            onChange={handleEndDateChange}
          />
        </div>
      </div>
    </div>
  );
}
