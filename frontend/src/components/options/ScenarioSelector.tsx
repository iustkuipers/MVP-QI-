/**
 * Scenario Selector component
 */

import React from 'react';
import styles from './ScenarioSelector.module.css';

type ScenarioType = 'monte-carlo' | 'crash' | 'surfaces';

interface ScenarioSelectorProps {
  scenarioType: ScenarioType;
  onScenarioTypeChange: (type: ScenarioType) => void;
}

const scenarios: Array<{ id: ScenarioType; label: string; description: string }> = [
  {
    id: 'monte-carlo',
    label: 'Monte Carlo',
    description: 'Probabilistic distribution analysis',
  },
  {
    id: 'crash',
    label: 'Crash Stress',
    description: 'Deterministic crash scenarios',
  },
  {
    id: 'surfaces',
    label: 'Surfaces',
    description: 'Risk grids (spot × vol, spot × time)',
  },
];

export function ScenarioSelector({ scenarioType, onScenarioTypeChange }: ScenarioSelectorProps) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Scenario Type</h2>
      
      <div className={styles.scenarioGrid}>
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            className={`${styles.scenarioOption} ${scenarioType === scenario.id ? styles.active : ''}`}
            onClick={() => onScenarioTypeChange(scenario.id)}
          >
            <div className={styles.label}>{scenario.label}</div>
            <div className={styles.description}>{scenario.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
