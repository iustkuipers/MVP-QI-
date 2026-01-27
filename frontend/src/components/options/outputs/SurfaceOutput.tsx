/**
 * Surface Output component - Heatmap visualization with clear axis labels
 */

import React, { useState } from 'react';
import styles from './SurfaceOutput.module.css';

interface SurfaceOutputProps {
  data: any;
  surfaceType?: 'spot-vol' | 'spot-time';
}

export function SurfaceOutput({ data, surfaceType = 'spot-vol' }: SurfaceOutputProps) {
  const [metric, setMetric] = useState<'value' | 'delta' | 'gamma'>('value');
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; value: number } | null>(null);

  if (!data || !data.value) {
    return <div className={styles.outputContainer}><p>No data available</p></div>;
  }

  const currentData = metric === 'value' ? data.value : metric === 'delta' ? (data.delta || data.value) : (data.gamma || data.value);

  if (!currentData || currentData.length === 0) {
    return (
      <div className={styles.outputContainer}>
        <p>No data available</p>
      </div>
    );
  }

  // Determine axis labels based on surface type
  const xAxisLabel = surfaceType === 'spot-time' ? 'Days to Expiry' : 'Volatility (%)';
  const yAxisLabel = 'Spot Price ($)';

  // Get min/max for color scaling
  const flat = currentData.flat().filter(isFinite);
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const range = max - min || 1;

  const getColor = (value: number) => {
    if (!isFinite(value)) return '#555';
    const normalized = (value - min) / range;
    const hue = (1 - normalized) * 240; // Blue to Red
    return `hsl(${hue}, 100%, 50%)`;
  };

  const getTextColor = (value: number) => {
    if (!isFinite(value)) return '#999';
    const normalized = (value - min) / range;
    return normalized > 0.5 ? '#000' : '#fff';
  };

  // Generate mock axis labels (would ideally come from backend)
  const numRows = currentData.length;
  const numCols = currentData[0]?.length || 0;
  
  const generateAxisLabels = (count: number, min: number, max: number) => {
    return Array.from({ length: count }, (_, i) => {
      const val = min + (i / (count - 1)) * (max - min);
      return val.toFixed(0);
    });
  };

  // Placeholder ranges - ideally these come from backend
  const spotLabels = generateAxisLabels(numRows, 150, 220);
  const xLabels = generateAxisLabels(numCols, surfaceType === 'spot-time' ? 5 : 0.15, surfaceType === 'spot-time' ? 30 : 0.35);

  const metricUnit = metric === 'value' ? '$' : metric === 'delta' ? '' : '';
  const metricLabel = metric === 'value' ? 'Portfolio Value' : metric === 'delta' ? 'Delta' : 'Gamma';

  return (
    <div className={styles.outputContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Surface Analysis: {metricLabel}</h2>
        <p className={styles.subtitle}>
          {surfaceType === 'spot-time' 
            ? 'Portfolio value across spot price and time to expiry'
            : 'Portfolio value across spot price and volatility'}
        </p>
      </div>

      <div className={styles.controls}>
        <label>
          Metric:
          <select value={metric} onChange={(e) => setMetric(e.target.value as any)}>
            <option value="value">Value</option>
            {data.delta && <option value="delta">Delta</option>}
            {data.gamma && <option value="gamma">Gamma</option>}
          </select>
        </label>
      </div>

      <div className={styles.heatmapContainer}>
        <div className={styles.yAxisLabel}>{yAxisLabel}</div>
        <div className={styles.heatmapWrapper}>
          {/* Row labels (spot prices) */}
          <div className={styles.rowLabelsColumn}>
            <div className={styles.cornerPlaceholder} />
            {spotLabels.map((label, i) => (
              <div key={i} className={styles.rowLabel}>
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className={styles.gridWrapper}>
            {/* Column labels (vol/time) */}
            <div className={styles.columnLabelsRow}>
              <div className={styles.cornerPlaceholder} />
              {xLabels.map((label, i) => (
                <div key={i} className={styles.colLabel}>
                  {label}
                </div>
              ))}
            </div>

            {/* Heatmap cells */}
            <div className={styles.heatmap}>
              {currentData.map((row: number[], rowIdx: number) => (
                <div key={rowIdx} className={styles.row}>
                  {row.map((cell: number, colIdx: number) => (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      className={styles.cell}
                      style={{ 
                        backgroundColor: getColor(cell),
                        color: getTextColor(cell)
                      }}
                      title={`Spot: ${spotLabels[rowIdx]}, ${xAxisLabel}: ${xLabels[colIdx]}, ${metricLabel}: ${cell.toFixed(2)}`}
                      onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx, value: cell })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <span className={styles.cellValue}>
                        {cell.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.xAxisLabel}>
          {xAxisLabel} {surfaceType === 'spot-time' ? '' : '(%)'}
        </div>
      </div>

      {/* Legend and scale */}
      <div className={styles.legendSection}>
        <div className={styles.scaleLegend}>
          <div className={styles.scaleLabel}>Low</div>
          <div className={styles.scaleBar} />
          <div className={styles.scaleLabel}>High</div>
        </div>

        <p className={styles.rangeInfo}>
          <strong>Range:</strong> {min.toFixed(2)} to {max.toFixed(2)} {metricUnit}
        </p>
      </div>

      {hoveredCell && (
        <div className={styles.tooltip}>
          <strong>Spot:</strong> ${spotLabels[hoveredCell.row]} | 
          <strong> {xAxisLabel}:</strong> {xLabels[hoveredCell.col]}{surfaceType === 'spot-time' ? ' days' : '%'} | 
          <strong> {metricLabel}:</strong> {hoveredCell.value.toFixed(2)} {metricUnit}
        </div>
      )}
    </div>
  );
}
