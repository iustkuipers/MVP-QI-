/**
 * Monte Carlo Output component
 */

import React from 'react';
import styles from './MonteCarloOutput.module.css';

interface MonteCarloOutputProps {
  data: any;
}

export function MonteCarloOutput({ data }: MonteCarloOutputProps) {
  if (!data) {
    return <div className={styles.outputContainer}>No data</div>;
  }

  const formatNumber = (n: any) => {
    if (n === undefined || n === null) return 'N/A';
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const summary = data.summary || {};
  const percentiles = data.percentiles || {};
  const tail_risk = data.tail_risk || {};

  return (
    <div className={styles.outputContainer}>
      <h2 className={styles.title}>Monte Carlo Results</h2>

      <div className={styles.metricsGrid}>
        <div className={styles.metric}>
          <div className={styles.label}>Mean</div>
          <div className={styles.value}>${formatNumber(summary.mean)}</div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Std Dev</div>
          <div className={styles.value}>${formatNumber(summary.std)}</div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Min</div>
          <div className={styles.value}>${formatNumber(summary.min)}</div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Max</div>
          <div className={styles.value}>${formatNumber(summary.max)}</div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>VaR 5%</div>
          <div className={styles.value}>${formatNumber(tail_risk.var_5)}</div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>VaR 1%</div>
          <div className={styles.value}>${formatNumber(tail_risk.var_1)}</div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>CVaR 5%</div>
          <div className={styles.value}>${formatNumber(tail_risk.cvar_5)}</div>
        </div>
      </div>

      {Object.keys(percentiles).length > 0 && (
        <div className={styles.percentilesSection}>
          <h3 className={styles.subtitle}>Percentiles</h3>
          <div className={styles.percentilesList}>
            {Object.entries(percentiles).map(([percentile, value]) => (
              <div key={percentile} className={styles.percentileRow}>
                <span className={styles.percentileLabel}>{percentile}</span>
                <span className={styles.percentileValue}>${formatNumber(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
