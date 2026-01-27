/**
 * Options Sandbox Page - Main component
 */

import React, { useState } from 'react';
import styles from './OptionsSandbox.module.css';
import { SymbolPicker } from '../../components/options/SymbolPicker';
import { StrategyBuilder } from '../../components/options/StrategyBuilder';
import { MarketAssumptions } from '../../components/options/MarketAssumptions';
import { SimulationSettings, SimulationParams } from '../../components/options/SimulationSettings';
import { StrategyTimelineGraph, TimelineData } from '../../components/options/StrategyTimelineGraph';

import { OptionPosition, MarketSnapshot } from '../../api/options';
import optionsAPI from '../../api/options';

export function OptionsSandbox() {
  const [symbol, setSymbol] = useState<string>('AAPL');

  const [positions, setPositions] = useState<OptionPosition[]>([
    {
      symbol: 'AAPL',
      type: 'call',
      strike: 180,
      expiry: '2026-06-19',
      quantity: 1,
    },
  ]);

  const [market, setMarket] = useState<MarketSnapshot>({
    spot: 185,
    rate: 0.03,
    volatility: 0.25,
    dividend_yield: 0.005,
  });

  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    startDate: '2026-01-22',
    endDate: '2026-06-19',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);

  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    setTimelineData(null);

    try {
      const result = await optionsAPI.strategyTimeline({
        positions,
        market,
        symbol,
        start_date: simulationParams.startDate,
        end_date: simulationParams.endDate,
      });

      setTimelineData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Options Sandbox</h1>
        <p>Analyze option strategies and scenarios in a risk laboratory</p>
      </div>

      <div className={styles.mainLayout}>
        {/* LEFT COLUMN - INPUTS */}
        <div className={styles.inputsColumn}>
          <SymbolPicker symbol={symbol} onSymbolChange={setSymbol} />

          <StrategyBuilder positions={positions} onPositionsChange={setPositions} />
          
          <MarketAssumptions market={market} onMarketChange={setMarket} />

          <SimulationSettings 
            params={simulationParams} 
            onParamsChange={setSimulationParams}
          />

          <button 
            className={styles.runButton}
            onClick={handleRunSimulation}
            disabled={loading}
          >
            {loading ? 'Running...' : 'Run Simulation'}
          </button>

          {error && (
            <div className={styles.errorMessage}>
              Error: {error}
            </div>
          )}
        </div>
      </div>

      {/* GRAPH - BELOW INPUTS */}
      {timelineData && (
        <div className={styles.graphSection}>
          <StrategyTimelineGraph 
            data={timelineData}
            utilityType={market.utility_type as 'risk-neutral' | 'crra' | 'cara' || 'risk-neutral'}
            crraGamma={market.crra_gamma}
            caraA={market.cara_a}
          />
        </div>
      )}
    </div>
  );
}
