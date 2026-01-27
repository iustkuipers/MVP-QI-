/**
 * Crash Output component
 */

import React from 'react';
import styles from './CrashOutput.module.css';

interface CrashOutputProps {
  data: any;
}

export function CrashOutput({ data }: CrashOutputProps) {
  if (!data || !Array.isArray(data)) {
    return <div className={styles.outputContainer}>No data</div>;
  }

  const formatNumber = (n: any) => {
    if (n === undefined || n === null) return 'N/A';
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const formatPercent = (n: any) => {
    if (n === undefined || n === null) return 'N/A';
    return ((Number(n)) * 100).toFixed(2);
  };

  return (
    <div className={styles.outputContainer}>
      <h2 className={styles.title}>Crash Stress Results</h2>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Crash %</th>
              <th>Spot After</th>
              <th>Portfolio Value</th>
              <th>Delta</th>
              <th>Gamma</th>
              <th>Theta</th>
              <th>Vega</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, idx: number) => (
              <tr key={idx}>
                <td className={styles.crash}>{formatPercent(row.crash_pct)}%</td>
                <td>${formatNumber(row.spot)}</td>
                <td className={styles.value}>${formatNumber(row.value)}</td>
                <td>{formatNumber(row.delta)}</td>
                <td>{formatNumber(row.gamma)}</td>
                <td>{formatNumber(row.theta)}</td>
                <td>{formatNumber(row.vega)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
