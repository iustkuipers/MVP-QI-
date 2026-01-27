/**
 * Strategy Timeline - Historical strategy evolution with manual run
 * Simple flow: select dates, click Run, view results
 */

import { useState } from 'react';
import styles from './StrategyTimeline.module.css';
import { optionsAPI, OptionPosition, MarketSnapshot } from '../../../api/options';

interface TimelineData {
  dates: string[];
  underlying: number[];
  portfolio_total: number[];
  portfolio_options: number[];
  instruments: {
    [key: string]: number[];
  };
  markers: Array<{
    date: string;
    label: string;
  }>;
}

interface InstrumentToggle {
  underlying: boolean;
  portfolio_total: boolean;
  portfolio_options: boolean;
  [key: string]: boolean;
}

interface MetricsRow {
  instrument: string;
  entryDate: string;
  expiryDate: string;
  startValue: number;
  endValue: number;
  pnl: number;
  pnlPercent: number;
  contribution: number;
}

interface StrategyTimelineProps {
  positions: OptionPosition[];
  market: MarketSnapshot;
  symbolName?: string;
}

export function StrategyTimeline({
  positions,
  market,
  symbolName = 'AAPL',
}: StrategyTimelineProps) {
  const [startDate, setStartDate] = useState('2025-12-22');
  const [endDate, setEndDate] = useState('2026-01-22');
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleInstruments, setVisibleInstruments] = useState<InstrumentToggle>({
    underlying: true,
    portfolio_total: true,
    portfolio_options: true,
  });

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      if (positions.length === 0) {
        setError('No positions defined. Add stocks or options first.');
        setTimelineData(null);
        setLoading(false);
        return;
      }

      const result = await optionsAPI.strategyTimeline({
        positions,
        market,
        symbol: symbolName,
        start_date: startDate,
        end_date: endDate,
      });

      if (result.error) {
        setError(result.error);
        setTimelineData(null);
      } else {
        setTimelineData(result);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Error: ${errorMsg}`);
      setTimelineData(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleInstrument = (instrument: string) => {
    setVisibleInstruments((prev) => ({
      ...prev,
      [instrument]: !prev[instrument],
    }));
  };

  // Render date inputs and run button
  const renderControls = () => (
    <div className={styles.controls}>
      <div className={styles.dateRange}>
        <div className={styles.dateField}>
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className={styles.dateField}>
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <button
        className={styles.runButton}
        onClick={handleRun}
        disabled={loading || positions.length === 0}
      >
        {loading ? 'Computing...' : 'Run Strategy Timeline'}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Strategy Timeline</h2>
        {renderControls()}
        <div className={styles.emptyBox}>
          <p>Computing strategy evolution...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Strategy Timeline</h2>
        {renderControls()}
        <div className={styles.errorBox}>
          <p>⚠️ {error}</p>
        </div>
      </div>
    );
  }

  if (!timelineData) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Strategy Timeline</h2>
        {renderControls()}
        <div className={styles.emptyBox}>
          <p>Select date range and click "Run Strategy Timeline" to analyze strategy evolution</p>
        </div>
      </div>
    );
  }

  // Extract instrument list
  const allInstruments = [
    'underlying',
    'portfolio_total',
    'portfolio_options',
    ...Object.keys(timelineData.instruments || {}),
  ];

  // Color map for instruments
  const colorMap: { [key: string]: string } = {
    underlying: '#888888',
    portfolio_total: '#00ff00',
    portfolio_options: '#00d4ff',
  };

  // Calculate chart dimensions
  const chartHeight = 300;
  const chartWidth = Math.max(timelineData.dates.length * 2, 600);

  // Find min/max for scaling
  const visibleData = timelineData.dates.map((date, idx) => {
    const values: number[] = [];
    if (visibleInstruments.underlying) values.push(timelineData.underlying[idx] || 0);
    if (visibleInstruments.portfolio_total) values.push(timelineData.portfolio_total[idx] || 0);
    if (visibleInstruments.portfolio_options) values.push(timelineData.portfolio_options[idx] || 0);
    Object.entries(visibleInstruments).forEach(([key, visible]) => {
      if (visible && key !== 'underlying' && key !== 'portfolio_total' && key !== 'portfolio_options') {
        values.push((timelineData.instruments[key]?.[idx] || 0));
      }
    });
    return values;
  });

  const allValues = visibleData.flat();
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue || 1;

  const scaleY = (value: number) => chartHeight - ((value - minValue) / valueRange) * chartHeight;
  const scaleX = (idx: number) => (idx / (timelineData.dates.length - 1 || 1)) * chartWidth;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Strategy Timeline</h2>
      {renderControls()}

      <div className={styles.content}>
        {/* Toggles on left */}
        <div className={styles.togglePanel}>
          {allInstruments.map((inst) => (
            <label key={inst} className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={visibleInstruments[inst] ?? false}
                onChange={() => toggleInstrument(inst)}
              />
              <span
                className={styles.colorDot}
                style={{ backgroundColor: colorMap[inst] || '#666' }}
              />
              <span className={styles.labelText}>{inst.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>

        {/* Chart on right */}
        <div className={styles.chartContainer}>
          <svg width={chartWidth} height={chartHeight} className={styles.chart}>
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#333" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />

            {/* Render visible instrument lines */}
            {visibleInstruments.underlying && (
              <polyline
                points={timelineData.dates
                  .map((_, idx) => `${scaleX(idx)},${scaleY(timelineData.underlying[idx])}`)
                  .join(' ')}
                fill="none"
                stroke={colorMap.underlying}
                strokeWidth="2"
              />
            )}

            {visibleInstruments.portfolio_total && (
              <polyline
                points={timelineData.dates
                  .map((_, idx) => `${scaleX(idx)},${scaleY(timelineData.portfolio_total[idx])}`)
                  .join(' ')}
                fill="none"
                stroke={colorMap.portfolio_total}
                strokeWidth="2"
              />
            )}

            {visibleInstruments.portfolio_options && (
              <polyline
                points={timelineData.dates
                  .map((_, idx) => `${scaleX(idx)},${scaleY(timelineData.portfolio_options[idx])}`)
                  .join(' ')}
                fill="none"
                stroke={colorMap.portfolio_options}
                strokeWidth="2"
              />
            )}

            {/* Markers for entry/expiry */}
            {timelineData.markers.map((marker, idx) => {
              const markerIdx = timelineData.dates.indexOf(marker.date);
              if (markerIdx === -1) return null;
              const x = scaleX(markerIdx);
              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1="0"
                    x2={x}
                    y2={chartHeight}
                    stroke={marker.label.includes('expired') ? '#ff6464' : '#00d4ff'}
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text x={x + 4} y="12" fontSize="10" fill="#999">
                    {marker.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Metrics table below */}
      {timelineData && (
        <div className={styles.metricsTable}>
          <h3>Metrics</h3>
          <table>
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Entry</th>
                <th>Expiry</th>
                <th>Start Value</th>
                <th>End Value</th>
                <th>P&L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos, idx) => {
                const instKey = pos.type === 'stock' ? 'stock' : `opt_${idx}`;
                const values = timelineData.instruments[instKey] || [];
                const startVal = values[0] || 0;
                const endVal = values[values.length - 1] || 0;
                const pnl = endVal - startVal;

                return (
                  <tr key={idx}>
                    <td>
                      {pos.type === 'stock'
                        ? `${pos.quantity} shares ${pos.symbol}`
                        : `${pos.type.toUpperCase()} ${pos.symbol} ${pos.strike}`}
                    </td>
                    <td>{startDate}</td>
                    <td>{pos.expiry || 'N/A'}</td>
                    <td>${startVal.toFixed(2)}</td>
                    <td>${endVal.toFixed(2)}</td>
                    <td className={pnl >= 0 ? styles.positive : styles.negative}>
                      ${pnl.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
