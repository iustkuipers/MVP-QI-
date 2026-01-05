/**
 * BacktestPage - Orchestration layer only
 * 
 * Responsibilities:
 * - Trigger backtest via useBacktest hook
 * - Hold loading/error/data state
 * - Hold FORM state (persists across data changes)
 * - Pass clean props downward
 * 
 * NO calculations, NO formatting logic
 */

import React, { useState } from 'react';
import { useBacktest } from '../../hooks/useBacktest';
import { styles } from './BacktestPage.styles';
import { BacktestForm } from '../../components/common/BacktestForm';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { NavChart } from '../../components/charts/NavChart';
import { EquityCashChart } from '../../components/charts/EquityCashChart';
import { PortfolioMetricsPanel } from '../../components/panels/PortfolioMetricsPanel';
import { RelativeMetricsPanel } from '../../components/panels/RelativeMetricsPanel';
import { IssuesPanel } from '../../components/panels/IssuesPanel';

interface Position {
  id: string;
  ticker: string;
  weight: string;
}

export function BacktestPage() {
  const { data, loading, error, run } = useBacktest();

  // Form state persists at page level
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2021-01-01');
  const [initialCash, setInitialCash] = useState('100000');
  const [positions, setPositions] = useState<Position[]>([
    { id: '1', ticker: 'AAPL', weight: '0.4' },
    { id: '2', ticker: 'MSFT', weight: '0.4' },
    { id: '3', ticker: 'IUST', weight: '0.1' },
  ]);
  const [riskFreeRate, setRiskFreeRate] = useState('0.03');
  const [benchmarkTicker, setBenchmarkTicker] = useState('VOO');

  if (loading) return <LoadingState />;
  if (error) {
    return (
      <div style={styles.container}>
        <ErrorState error={error.message} />
        <div style={{ marginTop: '24px' }}>
          <BacktestForm
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            initialCash={initialCash}
            onInitialCashChange={setInitialCash}
            positions={positions}
            onPositionsChange={setPositions}
            riskFreeRate={riskFreeRate}
            onRiskFreeRateChange={setRiskFreeRate}
            benchmarkTicker={benchmarkTicker}
            onBenchmarkTickerChange={setBenchmarkTicker}
            onSubmit={run}
            loading={loading}
          />
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Backtest Analysis</h1>
        <BacktestForm
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          initialCash={initialCash}
          onInitialCashChange={setInitialCash}
          positions={positions}
          onPositionsChange={setPositions}
          riskFreeRate={riskFreeRate}
          onRiskFreeRateChange={setRiskFreeRate}
          benchmarkTicker={benchmarkTicker}
          onBenchmarkTickerChange={setBenchmarkTicker}
          onSubmit={run}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Backtest Analysis</h1>
      </div>

      {/* Form for retry/adjust - state persists */}
      <div style={{ marginBottom: '32px' }}>
        <BacktestForm
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          initialCash={initialCash}
          onInitialCashChange={setInitialCash}
          positions={positions}
          onPositionsChange={setPositions}
          riskFreeRate={riskFreeRate}
          onRiskFreeRateChange={setRiskFreeRate}
          benchmarkTicker={benchmarkTicker}
          onBenchmarkTickerChange={setBenchmarkTicker}
          onSubmit={run}
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div style={styles.chartsGrid}>
        <NavChart series={data.navSeries} benchmark={data.benchmarkSeries} />
        <EquityCashChart equity={data.equitySeries} cash={data.cashSeries} />
      </div>

      {/* Metrics Panels */}
      <div style={styles.panelsGrid}>
        <PortfolioMetricsPanel metrics={data.portfolioMetrics} />
        {data.relativeMetrics && <RelativeMetricsPanel metrics={data.relativeMetrics} />}
      </div>

      {/* Issues */}
      {data.issues.length > 0 && <IssuesPanel issues={data.issues} />}
    </div>
  );
}
