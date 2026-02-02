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
  buy_and_hold: boolean;
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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  // Only show the most important lines by default
  const [visibleInstruments, setVisibleInstruments] = useState<InstrumentToggle>({
    underlying: true,
    portfolio_total: true,
    buy_and_hold: true,
    portfolio_options: false,  // Hidden by default - redundant when no stocks
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

      // Ensure all option positions have entry_date
      const positionsWithDates = positions.map((pos) => {
        if ((pos.type === 'call' || pos.type === 'put') && !pos.entry_date) {
          return {
            ...pos,
            entry_date: new Date().toISOString().split('T')[0],
          };
        }
        return pos;
      });

      console.log('=== POSITIONS DEBUG ===');
      console.log('POSITIONS BEFORE:', JSON.stringify(positions, null, 2));
      console.log('POSITIONS WITH DATES:', JSON.stringify(positionsWithDates, null, 2));

      const result = await optionsAPI.strategyTimeline({
        positions: positionsWithDates,
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

  // Extract instrument list - exclude portfolio_options as it's redundant
  const allInstruments = [
    'underlying',
    'portfolio_total',
    'buy_and_hold',
    ...Object.keys(timelineData.instruments || {}),
  ];

  // Color map for instruments
  const colorMap: { [key: string]: string } = {
    underlying: '#888888',
    portfolio_total: '#00ff00',
    buy_and_hold: '#ff9800',
    portfolio_options: '#00d4ff',
  };

  // Label map for clarity
  const labelMap: { [key: string]: string } = {
    underlying: 'Underlying Price',
    portfolio_total: 'Strategy Value (actual)',
    buy_and_hold: 'Buy & Hold (same capital in stock)',
    portfolio_options: 'Options Value Only',
  };

  // Calculate chart dimensions
  const chartHeight = 300;
  const chartWidth = Math.max(timelineData.dates.length * 2, 600);

  // Find min/max for scaling
  const visibleData = timelineData.dates.map((date, idx) => {
    const values: number[] = [];
    if (visibleInstruments.underlying) values.push(timelineData.underlying[idx] || 0);
    if (visibleInstruments.portfolio_total) values.push(timelineData.portfolio_total[idx] || 0);
    if (visibleInstruments.buy_and_hold) values.push(timelineData.buy_and_hold?.[idx] || 0);
    if (visibleInstruments.portfolio_options) values.push(timelineData.portfolio_options[idx] || 0);
    Object.entries(visibleInstruments).forEach(([key, visible]) => {
      if (visible && key !== 'underlying' && key !== 'portfolio_total' && key !== 'buy_and_hold' && key !== 'portfolio_options') {
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
              <span className={styles.labelText}>
                {labelMap[inst] || inst.replace(/_/g, ' ')}
              </span>
            </label>
          ))}
        </div>

        {/* Chart on right */}
        <div className={styles.chartContainer}>
          <svg width={chartWidth} height={chartHeight} className={styles.chart}>
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#d0d0d0" strokeWidth="0.5" />
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

            {visibleInstruments.buy_and_hold && (
              <polyline
                points={timelineData.dates
                  .map((_, idx) => `${scaleX(idx)},${scaleY(timelineData.buy_and_hold?.[idx] || 0)}`)
                  .join(' ')}
                fill="none"
                stroke={colorMap.buy_and_hold}
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
              const isExpiry = marker.label.includes('expir');
              // Extract option number from label (e.g., "CALL #1 entry" -> "1")
              const numberMatch = marker.label.match(/#(\d+)/);
              const optionNum = numberMatch ? numberMatch[1] : '';
              // Alternate label position: Entry at top, Expiry at bottom
              const textY = isExpiry ? chartHeight - 4 : 12;
              const textAnchor = isExpiry ? 'start' : 'start';
              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1="0"
                    x2={x}
                    y2={chartHeight}
                    stroke={isExpiry ? '#ff6464' : '#1976d2'}
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    opacity="0.7"
                  />
                  <text x={x + 4} y={textY} fontSize="11" fontWeight="600" fill={isExpiry ? '#ff6464' : '#1976d2'} textAnchor={textAnchor}>
                    {optionNum}
                  </text>
                </g>
              );
            })}

            {/* Hover overlay and tooltip */}
            <rect
              width={chartWidth}
              height={chartHeight}
              fill="transparent"
              onMouseMove={(e) => {
                const svg = e.currentTarget.ownerSVGElement;
                if (!svg) return;
                const rect = svg.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const idx = Math.round((x / chartWidth) * (timelineData.dates.length - 1));
                if (idx >= 0 && idx < timelineData.dates.length) {
                  setHoveredIdx(idx);
                }
              }}
              onMouseLeave={() => setHoveredIdx(null)}
            />

            {/* Tooltip on hover */}
            {hoveredIdx !== null && (
              <g>
                {/* Vertical line at hover position */}
                <line
                  x1={scaleX(hoveredIdx)}
                  y1="0"
                  x2={scaleX(hoveredIdx)}
                  y2={chartHeight}
                  stroke="#333"
                  strokeWidth="1"
                  opacity="0.3"
                  pointerEvents="none"
                />
                {/* Tooltip box */}
                <rect
                  x={scaleX(hoveredIdx) + 10}
                  y="10"
                  width="220"
                  height={visibleInstruments.underlying && visibleInstruments.portfolio_total && visibleInstruments.buy_and_hold ? 90 : 60}
                  fill="white"
                  stroke="#333"
                  strokeWidth="1"
                  rx="4"
                  pointerEvents="none"
                />
                <text x={scaleX(hoveredIdx) + 16} y="28" fontSize="12" fontWeight="600" fill="#333" pointerEvents="none">
                  {timelineData.dates[hoveredIdx]}
                </text>
                {visibleInstruments.underlying && (
                  <text x={scaleX(hoveredIdx) + 16} y="46" fontSize="11" fill="#888888" pointerEvents="none">
                    Underlying: ${timelineData.underlying[hoveredIdx]?.toFixed(2) || '0.00'}
                  </text>
                )}
                {visibleInstruments.portfolio_total && (
                  <text x={scaleX(hoveredIdx) + 16} y="61" fontSize="11" fill="#00ff00" pointerEvents="none">
                    Strategy: ${timelineData.portfolio_total[hoveredIdx]?.toFixed(2) || '0.00'}
                  </text>
                )}
                {visibleInstruments.buy_and_hold && (
                  <text x={scaleX(hoveredIdx) + 16} y="76" fontSize="11" fill="#ff9800" pointerEvents="none">
                    Buy & Hold: ${timelineData.buy_and_hold?.[hoveredIdx]?.toFixed(2) || '0.00'}
                  </text>
                )}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Legend below chart */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#888888' }}></div>
          <span>Underlying Price</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#00ff00' }}></div>
          <span>Strategy Value (actual)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#ff9800' }}></div>
          <span>Buy & Hold (same capital in stock)</span>
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
                
                // Find value at entry date
                const entryDateStr = pos.entry_date || timelineData.dates[0];
                const entryDateIdx = timelineData.dates.indexOf(entryDateStr);
                const startVal = entryDateIdx >= 0 ? values[entryDateIdx] : 0;
                
                // End value is always the last value
                const endVal = values[values.length - 1] || 0;
                const pnl = endVal - startVal;
                const pnlPercent = startVal !== 0 ? (pnl / Math.abs(startVal)) * 100 : 0;

                return (
                  <tr key={idx}>
                    <td>
                      {pos.type === 'stock'
                        ? `${pos.quantity} shares ${pos.symbol}`
                        : `${pos.type.toUpperCase()} ${pos.symbol} ${pos.strike}`}
                    </td>
                    <td>{pos.entry_date || startDate}</td>
                    <td>{pos.expiry || 'N/A'}</td>
                    <td>${startVal.toFixed(2)}</td>
                    <td>${endVal.toFixed(2)}</td>
                    <td className={pnl >= 0 ? styles.positive : styles.negative}>
                      ${pnl.toFixed(2)} ({pnlPercent.toFixed(1)}%)
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
