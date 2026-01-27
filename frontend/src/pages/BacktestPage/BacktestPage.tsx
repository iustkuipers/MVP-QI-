/**
 * BacktestPage - Portfolio Lab with comparison support
 * 
 * Responsibilities:
 * - Single mode: run one backtest, view results
 * - Compare mode: run two backtests, side-by-side configs with results below
 * - Hold FORM state for A and B (persists across data changes)
 * - Show Portfolio A results while waiting for Portfolio B
 * - Restore comparison state from URL if present
 * 
 * NO calculations, NO formatting logic
 */

import React, { useState, useEffect } from 'react';
import { useBacktestComparison } from '../../hooks/useBacktestComparison';
import { restoreStateFromUrl } from '../../utils/comparisonLink';
import { styles } from './BacktestPage.styles';
import { BacktestForm } from '../../components/common/BacktestForm';
import { ModeToggle } from '../../components/common/ModeToggle';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { NavChart } from '../../components/charts/NavChart';
import { EquityCashChart } from '../../components/charts/EquityCashChart';
import { PortfolioMetricsPanel } from '../../components/panels/PortfolioMetricsPanel';
import { RelativeMetricsPanel } from '../../components/panels/RelativeMetricsPanel';
import { RollingMetricsPanel } from '../../components/panels/RollingMetricsPanel';
import { IssuesPanel } from '../../components/panels/IssuesPanel';
import { ComparisonHeader } from '../../components/panels/ComparisonHeader';
import { MetricsComparisonTable } from '../../components/panels/MetricsComparisonTable';
import { NavComparisonChart } from '../../components/charts/NavComparisonChart';
import { RollingMetricsComparison } from '../../components/panels/RollingMetricsComparison';

interface Position {
  id: string;
  ticker: string;
  weight: string;
}

interface FormState {
  startDate: string;
  endDate: string;
  initialCash: string;
  positions: Position[];
  riskFreeRate: string;
  benchmarkTicker: string;
  fractionalShares: boolean;
  riskFreeCompounding: string;
}

const DEFAULT_FORM_STATE: FormState = {
  startDate: '2020-01-01',
  endDate: '2021-01-01',
  initialCash: '100000',
  positions: [
    { id: '1', ticker: 'AAPL', weight: '0.4' },
    { id: '2', ticker: 'MSFT', weight: '0.4' },
    { id: '3', ticker: 'IUST', weight: '0.1' },
  ],
  riskFreeRate: '0.03',
  benchmarkTicker: 'VOO',
  fractionalShares: false,
  riskFreeCompounding: 'daily',
};

export function BacktestPage() {
  const {
    singleData,
    singleLoading,
    singleError,
    runSingle,
    comparisonA,
    comparisonB,
    comparisonLoading,
    setComparisonALabel,
    setComparisonBLabel,
    runComparisonA,
    runComparisonB,
    addComparison,
    mode,
    setMode,
  } = useBacktestComparison();

  const [formA, setFormA] = useState<FormState>(DEFAULT_FORM_STATE);
  const [formB, setFormB] = useState<FormState>(DEFAULT_FORM_STATE);
  const [restoredFromUrl, setRestoredFromUrl] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'copied'>('idle');

  // Handle copy run link (single mode)
  const handleCopyRunLink = async () => {
    if (!singleData) return;

    try {
      const { buildRunLink, copyToClipboard } = await import('../../utils/comparisonLink');

      const config = {
        start_date: formA.startDate,
        end_date: formA.endDate,
        initial_cash: parseFloat(formA.initialCash),
        positions: formA.positions
          .filter(p => p.ticker)
          .map(p => ({ ticker: p.ticker, weight: parseFloat(p.weight) })),
        risk_free_rate: parseFloat(formA.riskFreeRate),
        benchmark_ticker: formA.benchmarkTicker || undefined,
        rebalance: 'daily',
        fractional_shares: formA.fractionalShares,
        risk_free_compounding: formA.riskFreeCompounding,
        data_provider: 'yfinance',
      };

      const link = await buildRunLink(config);
      const success = await copyToClipboard(link);
      if (success) {
        setCopyFeedback('copied');
        setTimeout(() => setCopyFeedback('idle'), 2000);
      }
    } catch (error) {
      console.error('Failed to copy run link:', error);
    }
  };

  // Handle copy comparison link
  const handleCopyComparisonLink = async () => {
    if (!comparisonA || !comparisonB) return;

    try {
      const { buildComparisonLink, copyToClipboard } = await import('../../utils/comparisonLink');

      const configA = {
        start_date: formA.startDate,
        end_date: formA.endDate,
        initial_cash: parseFloat(formA.initialCash),
        positions: formA.positions
          .filter(p => p.ticker)
          .map(p => ({ ticker: p.ticker, weight: parseFloat(p.weight) })),
        risk_free_rate: parseFloat(formA.riskFreeRate),
        benchmark_ticker: formA.benchmarkTicker || undefined,
        rebalance: 'daily',
        fractional_shares: formA.fractionalShares,
        risk_free_compounding: formA.riskFreeCompounding,
        data_provider: 'yfinance',
      };

      const configB = {
        start_date: formB.startDate,
        end_date: formB.endDate,
        initial_cash: parseFloat(formB.initialCash),
        positions: formB.positions
          .filter(p => p.ticker)
          .map(p => ({ ticker: p.ticker, weight: parseFloat(p.weight) })),
        risk_free_rate: parseFloat(formB.riskFreeRate),
        benchmark_ticker: formB.benchmarkTicker || undefined,
        rebalance: 'daily',
        fractional_shares: formB.fractionalShares,
        risk_free_compounding: formB.riskFreeCompounding,
        data_provider: 'yfinance',
      };

      const link = await buildComparisonLink({
        mode: 'compare',
        configA,
        configB,
      });

      const success = await copyToClipboard(link);
      if (success) {
        setCopyFeedback('copied');
        setTimeout(() => setCopyFeedback('idle'), 2000);
      }
    } catch (error) {
      console.error('Failed to copy comparison link:', error);
    }
  };

  // Restore from URL on mount (handles both single and comparison modes)
  useEffect(() => {
    const restoreFromUrl = async () => {
      try {
        const state = await restoreStateFromUrl();
        if (!state) return;

        // Helper to convert config to form state
        const toFormState = (config: any): FormState => ({
          startDate: config.start_date,
          endDate: config.end_date,
          initialCash: config.initial_cash.toString(),
          positions: config.positions.map((p: any) => ({
            id: p.ticker,
            ticker: p.ticker,
            weight: p.weight.toString(),
          })),
          riskFreeRate: config.risk_free_rate.toString(),
          benchmarkTicker: config.benchmark_ticker || '',
          fractionalShares: config.fractional_shares,
          riskFreeCompounding: config.risk_free_compounding,
        });

        if (state.mode === 'single') {
          // Single run: restore formA and auto-run
          const newFormA = toFormState(state.config);
          setFormA(newFormA);
          setMode('single');
          setRestoredFromUrl(true);

          // Auto-run backtest
          setTimeout(() => {
            runSingle(state.config);
          }, 100);
        } else if (state.mode === 'compare') {
          // Comparison: restore formA + formB and auto-run both
          const newFormA = toFormState(state.configA);
          const newFormB = toFormState(state.configB);

          setFormA(newFormA);
          setFormB(newFormB);
          setMode('compare');
          setRestoredFromUrl(true);

          // Auto-run both backtests
          setTimeout(() => {
            runComparisonA(state.configA);
            runComparisonB(state.configB);
          }, 100);
        }
      } catch (error) {
        console.warn('Failed to restore from URL:', error);
        // Silently fail - just show default state
      }
    };

    restoreFromUrl();
  }, [runSingle, runComparisonA, runComparisonB, setMode]);

  if (singleLoading || comparisonLoading) return <LoadingState />;

  // ==================== SINGLE MODE ====================

  if (mode === 'single' && singleError) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Portfolio Lab</h1>
        <div style={styles.theoreticalFramework}>
          <p style={{margin: '0 0 8px 0'}}><strong>Theoretical framework:</strong></p>
          <ul style={{margin: '0', paddingLeft: '20px'}}>
            <li>Mean–Variance analysis (elliptical returns assumption)</li>
            <li>CAPM-relative evaluation</li>
          </ul>
        </div>
        <ErrorState error={singleError.message} />
        <div style={{ marginTop: '24px' }}>
          <BacktestForm
            startDate={formA.startDate}
            onStartDateChange={date => setFormA({ ...formA, startDate: date })}
            endDate={formA.endDate}
            onEndDateChange={date => setFormA({ ...formA, endDate: date })}
            initialCash={formA.initialCash}
            onInitialCashChange={cash => setFormA({ ...formA, initialCash: cash })}
            positions={formA.positions}
            onPositionsChange={pos => setFormA({ ...formA, positions: pos })}
            riskFreeRate={formA.riskFreeRate}
            onRiskFreeRateChange={rate => setFormA({ ...formA, riskFreeRate: rate })}
            benchmarkTicker={formA.benchmarkTicker}
            onBenchmarkTickerChange={ticker => setFormA({ ...formA, benchmarkTicker: ticker })}
            fractionalShares={formA.fractionalShares}
            onFractionalSharesChange={frac => setFormA({ ...formA, fractionalShares: frac })}
            riskFreeCompounding={formA.riskFreeCompounding}
            onRiskFreeCompoundingChange={comp => setFormA({ ...formA, riskFreeCompounding: comp })}
            onSubmit={payload => runSingle(payload)}
            loading={singleLoading}
          />
        </div>
      </div>
    );
  }

  if (mode === 'single' && !singleData) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Portfolio Lab</h1>
        <div style={styles.theoreticalFramework}>
          <p style={{margin: '0 0 8px 0'}}><strong>Theoretical framework:</strong></p>
          <ul style={{margin: '0', paddingLeft: '20px'}}>
            <li>Mean–Variance analysis (elliptical returns assumption)</li>
            <li>CAPM-relative evaluation</li>
          </ul>
        </div>
        <BacktestForm
          startDate={formA.startDate}
          onStartDateChange={date => setFormA({ ...formA, startDate: date })}
          endDate={formA.endDate}
          onEndDateChange={date => setFormA({ ...formA, endDate: date })}
          initialCash={formA.initialCash}
          onInitialCashChange={cash => setFormA({ ...formA, initialCash: cash })}
          positions={formA.positions}
          onPositionsChange={pos => setFormA({ ...formA, positions: pos })}
          riskFreeRate={formA.riskFreeRate}
          onRiskFreeRateChange={rate => setFormA({ ...formA, riskFreeRate: rate })}
          benchmarkTicker={formA.benchmarkTicker}
          onBenchmarkTickerChange={ticker => setFormA({ ...formA, benchmarkTicker: ticker })}
          fractionalShares={formA.fractionalShares}
          onFractionalSharesChange={frac => setFormA({ ...formA, fractionalShares: frac })}
          riskFreeCompounding={formA.riskFreeCompounding}
          onRiskFreeCompoundingChange={comp => setFormA({ ...formA, riskFreeCompounding: comp })}
          onSubmit={payload => runSingle(payload)}
          loading={singleLoading}
        />
      </div>
    );
  }

  if (mode === 'single' && singleData) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Portfolio Lab</h1>

        <div style={styles.section}>
          <BacktestForm
            startDate={formA.startDate}
            onStartDateChange={date => setFormA({ ...formA, startDate: date })}
            endDate={formA.endDate}
            onEndDateChange={date => setFormA({ ...formA, endDate: date })}
            initialCash={formA.initialCash}
            onInitialCashChange={cash => setFormA({ ...formA, initialCash: cash })}
            positions={formA.positions}
            onPositionsChange={pos => setFormA({ ...formA, positions: pos })}
            riskFreeRate={formA.riskFreeRate}
            onRiskFreeRateChange={rate => setFormA({ ...formA, riskFreeRate: rate })}
            benchmarkTicker={formA.benchmarkTicker}
            onBenchmarkTickerChange={ticker => setFormA({ ...formA, benchmarkTicker: ticker })}
            fractionalShares={formA.fractionalShares}
            onFractionalSharesChange={frac => setFormA({ ...formA, fractionalShares: frac })}
            riskFreeCompounding={formA.riskFreeCompounding}
            onRiskFreeCompoundingChange={comp => setFormA({ ...formA, riskFreeCompounding: comp })}
            onSubmit={payload => runSingle(payload)}
            loading={singleLoading}
          />

          <button
            style={styles.addComparisonButton}
            onClick={() => {
              addComparison();
              setMode('compare');
            }}
          >
            + Add Comparison
          </button>
        </div>

        <div style={styles.resultsHeader}>
          <h2 style={styles.resultsTitle}>Results</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={handleCopyRunLink}
              style={{
                ...styles.copyButton,
                backgroundColor: copyFeedback === 'copied' ? '#4caf50' : '#1976d2',
              }}
            >
              {copyFeedback === 'copied' ? '✓ Copied' : 'Copy run link'}
            </button>
            <ModeToggle
              mode={mode}
              onModeChange={setMode}
              disabled={true}
              disabledTooltip="Run a second backtest to compare"
            />
          </div>
        </div>

        <h2 style={styles.sectionTitle}>Portfolio Summary</h2>
        <div style={styles.chartsGrid}>
          <NavChart series={singleData.navSeries} benchmark={singleData.benchmarkSeries} />
          <EquityCashChart equity={singleData.equitySeries} cash={singleData.cashSeries} />
        </div>

        <h2 style={styles.sectionTitle}>Performance Metrics</h2>
        <div style={styles.panelsGrid}>
          <PortfolioMetricsPanel metrics={singleData.portfolioMetrics} />
          {singleData.relativeMetrics && (
            <RelativeMetricsPanel metrics={singleData.relativeMetrics} />
          )}
        </div>

        <h2 style={styles.sectionTitle}>Rolling Analysis</h2>
        <RollingMetricsPanel data={singleData.rollingMetrics} />

        {singleData.issues.length > 0 && <IssuesPanel issues={singleData.issues} />}
      </div>
    );
  }

  // ==================== COMPARISON MODE ====================

  // Side-by-side forms, with results below when available
  if (mode === 'compare') {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Portfolio Lab</h1>
        <div style={styles.theoreticalFramework}>
          <p style={{margin: '0 0 8px 0'}}><strong>Theoretical framework:</strong></p>
          <ul style={{margin: '0', paddingLeft: '20px'}}>
            <li>Mean–Variance analysis (elliptical returns assumption)</li>
            <li>CAPM-relative evaluation</li>
          </ul>
        </div>

        {/* FORMS: Side by side */}
        <div style={styles.twoColumnLayout}>
          <div style={styles.configPanel}>
            <h2 style={styles.sectionTitle}>Portfolio A</h2>
            <BacktestForm
              startDate={formA.startDate}
              onStartDateChange={date => setFormA({ ...formA, startDate: date })}
              endDate={formA.endDate}
              onEndDateChange={date => setFormA({ ...formA, endDate: date })}
              initialCash={formA.initialCash}
              onInitialCashChange={cash => setFormA({ ...formA, initialCash: cash })}
              positions={formA.positions}
              onPositionsChange={pos => setFormA({ ...formA, positions: pos })}
              riskFreeRate={formA.riskFreeRate}
              onRiskFreeRateChange={rate => setFormA({ ...formA, riskFreeRate: rate })}
              benchmarkTicker={formA.benchmarkTicker}
              onBenchmarkTickerChange={ticker => setFormA({ ...formA, benchmarkTicker: ticker })}
              fractionalShares={formA.fractionalShares}
              onFractionalSharesChange={frac => setFormA({ ...formA, fractionalShares: frac })}
              riskFreeCompounding={formA.riskFreeCompounding}
              onRiskFreeCompoundingChange={comp => setFormA({ ...formA, riskFreeCompounding: comp })}
              onSubmit={payload => runComparisonA(payload)}
              loading={comparisonLoading}
            />
          </div>

          <div style={styles.configPanel}>
            <h2 style={styles.sectionTitle}>Portfolio B</h2>
            {comparisonA ? (
              <BacktestForm
                startDate={formB.startDate}
                onStartDateChange={date => setFormB({ ...formB, startDate: date })}
                endDate={formB.endDate}
                onEndDateChange={date => setFormB({ ...formB, endDate: date })}
                initialCash={formB.initialCash}
                onInitialCashChange={cash => setFormB({ ...formB, initialCash: cash })}
                positions={formB.positions}
                onPositionsChange={pos => setFormB({ ...formB, positions: pos })}
                riskFreeRate={formB.riskFreeRate}
                onRiskFreeRateChange={rate => setFormB({ ...formB, riskFreeRate: rate })}
                benchmarkTicker={formB.benchmarkTicker}
                onBenchmarkTickerChange={ticker => setFormB({ ...formB, benchmarkTicker: ticker })}
                fractionalShares={formB.fractionalShares}
                onFractionalSharesChange={frac => setFormB({ ...formB, fractionalShares: frac })}
                riskFreeCompounding={formB.riskFreeCompounding}
                onRiskFreeCompoundingChange={comp => setFormB({ ...formB, riskFreeCompounding: comp })}
                onSubmit={payload => runComparisonB(payload)}
                loading={comparisonLoading}
              />
            ) : (
              <p style={styles.emptyMessage}>Run Portfolio A first</p>
            )}
          </div>
        </div>

        {/* RESULTS: Show when both done */}
        {comparisonA && comparisonB && (
          <>
            <div style={styles.resultsHeader}>
              <h2 style={styles.resultsTitle}>Comparison Results</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={handleCopyComparisonLink}
                  style={{
                    ...styles.copyButton,
                    backgroundColor: copyFeedback === 'copied' ? '#4caf50' : '#1976d2',
                  }}
                >
                  {copyFeedback === 'copied' ? '✓ Copied' : 'Copy comparison link'}
                </button>
                <ModeToggle mode={mode} onModeChange={setMode} />
              </div>
            </div>

            <ComparisonHeader labelA={comparisonA.label} labelB={comparisonB.label} />

            <MetricsComparisonTable
              portfolioALabel={comparisonA.label}
              portfolioBLabel={comparisonB.label}
              metricsA={comparisonA.data.portfolioMetrics}
              metricsB={comparisonB.data.portfolioMetrics}
              metricLabels={{
                total_return: 'Total Return',
                cagr: 'CAGR',
                volatility: 'Volatility',
                sharpe: 'Sharpe Ratio',
                max_drawdown: 'Max Drawdown',
              }}
              formatters={{
                total_return: (v: number) => `${(v * 100).toFixed(1)}%`,
                cagr: (v: number) => `${(v * 100).toFixed(1)}%`,
                volatility: (v: number) => `${(v * 100).toFixed(1)}%`,
                sharpe: (v: number) => v.toFixed(2),
                max_drawdown: (v: number) => `${(v * 100).toFixed(1)}%`,
              }}
            />

            {Array.isArray(comparisonA.data.navSeries) && Array.isArray(comparisonB.data.navSeries) && (
              <NavComparisonChart
                portfolioALabel={comparisonA.label}
                portfolioBLabel={comparisonB.label}
                dataA={comparisonA.data.navSeries}
                dataB={comparisonB.data.navSeries}
              />
            )}

            <RollingMetricsComparison
              portfolioALabel={comparisonA.label}
              portfolioBLabel={comparisonB.label}
              metricsA={comparisonA.data.rollingMetrics}
              metricsB={comparisonB.data.rollingMetrics}
            />

            {(comparisonA.data.issues.length > 0 || comparisonB.data.issues.length > 0) && (
              <div>
                <h2 style={styles.sectionTitle}>Issues</h2>
                {comparisonA.data.issues.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={styles.subSectionTitle}>{comparisonA.label}</h3>
                    <IssuesPanel issues={comparisonA.data.issues} />
                  </div>
                )}
                {comparisonB.data.issues.length > 0 && (
                  <div>
                    <h3 style={styles.subSectionTitle}>{comparisonB.label}</h3>
                    <IssuesPanel issues={comparisonB.data.issues} />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* PREVIEW: Show Portfolio A results while waiting for B */}
        {comparisonA && !comparisonB && (
          <>
            <div style={styles.resultsHeader}>
              <h2 style={styles.resultsTitle}>{comparisonA.label} Results (Preview)</h2>
            </div>

            <h2 style={styles.sectionTitle}>Portfolio Summary</h2>
            <div style={styles.chartsGrid}>
              <NavChart series={comparisonA.data.navSeries} benchmark={comparisonA.data.benchmarkSeries} />
              <EquityCashChart equity={comparisonA.data.equitySeries} cash={comparisonA.data.cashSeries} />
            </div>

            <h2 style={styles.sectionTitle}>Performance Metrics</h2>
            <div style={styles.panelsGrid}>
              <PortfolioMetricsPanel metrics={comparisonA.data.portfolioMetrics} />
              {comparisonA.data.relativeMetrics && (
                <RelativeMetricsPanel metrics={comparisonA.data.relativeMetrics} />
              )}
            </div>

            <h2 style={styles.sectionTitle}>Rolling Analysis</h2>
            <RollingMetricsPanel data={comparisonA.data.rollingMetrics} />

            {comparisonA.data.issues.length > 0 && <IssuesPanel issues={comparisonA.data.issues} />}
          </>
        )}
      </div>
    );
  }

  return <EmptyState />;
}

