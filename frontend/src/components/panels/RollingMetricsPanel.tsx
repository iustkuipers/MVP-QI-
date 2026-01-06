/**
 * RollingMetricsPanel - Display rolling metrics in an accordion or tabbed layout
 * 
 * Shows:
 * - Rolling Volatility (12 months)
 * - Rolling Sharpe (12 months)
 * - Rolling Max Drawdown (12 months)
 * - Rolling CAGR (12 months)
 * 
 * Microcopy explains that rolling metrics are diagnostic, not conclusive
 */

import React, { useState } from 'react';
import { RollingMetricsResponse } from '../../api/types';
import { RollingMetricChart } from '../charts/RollingMetricChart';

interface RollingMetricsPanelProps {
  data: RollingMetricsResponse | null;
}

type TabName = 'volatility' | 'sharpe' | 'drawdown' | 'cagr';

export function RollingMetricsPanel({ data }: RollingMetricsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabName>('volatility');
  const [showOnlyValid, setShowOnlyValid] = useState(false);

  if (!data) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Rolling Metrics</h2>
        <p style={styles.emptyMessage}>
          Rolling metrics are computed once sufficient history is available.
        </p>
      </div>
    );
  }

  const windowDays = data.window_days || 252;
  const windowLabel = windowDays === 252 ? '12 months' : `${windowDays} days`;

  const tabs: Array<{ name: TabName; label: string }> = [
    { name: 'volatility', label: 'Rolling Volatility' },
    { name: 'sharpe', label: 'Rolling Sharpe' },
    { name: 'drawdown', label: 'Rolling Max Drawdown' },
    { name: 'cagr', label: 'Rolling CAGR' },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Rolling Metrics ({windowLabel})</h2>
      <p style={styles.subtitle}>
        Diagnostic metrics computed over rolling time windows. These show how
        strategy characteristics evolved over time.
      </p>

      {/* Toggle for valid period */}
      <div style={styles.controls}>
        <label style={styles.label}>
          <input
            type="checkbox"
            checked={showOnlyValid}
            onChange={e => setShowOnlyValid(e.target.checked)}
            style={styles.checkbox}
          />
          {showOnlyValid ? '✓ Showing valid period only' : 'Show full date range (including NaN)'}
        </label>
      </div>

      {/* Tab buttons */}
      <div style={styles.tabButtons}>
        {tabs.map(tab => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab.name
                ? styles.tabButtonActive
                : styles.tabButtonInactive),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={styles.tabContent}>
        {activeTab === 'volatility' && (
          <RollingMetricChart
            title="Rolling Annualized Volatility"
            description="Strategy volatility computed over the previous 252 trading days (~12 months)"
            data={data.series.rolling_volatility}
            windowDays={windowDays}
            showOnlyValid={showOnlyValid}
          />
        )}

        {activeTab === 'sharpe' && (
          <RollingMetricChart
            title="Rolling Sharpe Ratio"
            description="Risk-adjusted returns computed over the previous 252 trading days (~12 months)"
            data={data.series.rolling_sharpe}
            windowDays={windowDays}
            showOnlyValid={showOnlyValid}
          />
        )}

        {activeTab === 'drawdown' && (
          <RollingMetricChart
            title="Rolling Maximum Drawdown"
            description="Worst peak-to-trough decline computed over the previous 252 trading days (~12 months)"
            data={data.series.rolling_max_drawdown}
            windowDays={windowDays}
            showOnlyValid={showOnlyValid}
          />
        )}

        {activeTab === 'cagr' && (
          <RollingMetricChart
            title="Rolling CAGR"
            description="Annualized compound growth rate computed over the previous 252 trading days (~12 months)"
            data={data.series.rolling_cagr}
            windowDays={windowDays}
            showOnlyValid={showOnlyValid}
          />
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },

  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },

  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 16px 0',
  },

  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #e8e8e8',
  },

  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#666',
    cursor: 'pointer',
  },

  checkbox: {
    cursor: 'pointer',
  },

  emptyMessage: {
    fontSize: '14px',
    color: '#999',
    fontStyle: 'italic',
  },

  tabButtons: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: '8px',
    flexWrap: 'wrap',
  },

  tabButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },

  tabButtonActive: {
    backgroundColor: '#1976d2',
    color: '#fff',
  },

  tabButtonInactive: {
    backgroundColor: '#f0f0f0',
    color: '#333',
  },

  tabContent: {
    marginTop: '16px',
  },
};
