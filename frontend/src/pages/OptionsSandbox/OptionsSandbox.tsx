/**
 * Options Sandbox Page - Main component
 * Currently focused on options strategy building
 */

import React, { useState } from 'react';
import styles from './OptionsSandbox.module.css';
import { StrategyBuilder } from '../../components/options/StrategyBuilder';
import { MarketAssumptions } from '../../components/options/MarketAssumptions';
// TODO: Enable these components later
// import { ScenarioSelector } from '../../components/options/ScenarioSelector';
// import { MonteCarloScenario } from '../../components/options/scenarios/MonteCarloScenario';
// import { CrashScenario } from '../../components/options/scenarios/CrashScenario';
// import { SurfaceScenario } from '../../components/options/scenarios/SurfaceScenario';
// import { MonteCarloOutput } from '../../components/options/outputs/MonteCarloOutput';
// import { CrashOutput } from '../../components/options/outputs/CrashOutput';
// import { SurfaceOutput } from '../../components/options/outputs/SurfaceOutput';
// import { MarketContext } from '../../components/options/outputs/MarketContext';
import { StrategyTimeline } from '../../components/options/outputs/StrategyTimeline';

import { OptionPosition, MarketSnapshot } from '../../api/options';

export function OptionsSandbox() {
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

  const isStrategyValid = positions.length > 0 && positions.every(
    p => p.symbol && p.type && p.strike && p.expiry && p.quantity
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Options Sandbox</h1>
        <p>Build and visualize option strategies</p>
      </div>

      <div className={styles.mainLayout}>
        {/* LEFT COLUMN - INPUTS */}
        <div className={styles.inputsColumn}>
          <StrategyBuilder positions={positions} onPositionsChange={setPositions} />
          
          <MarketAssumptions market={market} onMarketChange={setMarket} />
          
          {/* TODO: Enable scenario selectors later
          <ScenarioSelector scenarioType={scenarioType} onScenarioTypeChange={setScenarioType} />
          
          <div className={styles.scenarioInputs}>
            {scenarioType === 'monte-carlo' && (
              <MonteCarloScenario
                positions={positions}
                market={market}
                onOutput={setOutput}
                onError={setError}
                onLoading={setLoading}
              />
            )}
            
            {scenarioType === 'crash' && (
              <CrashScenario
                positions={positions}
                market={market}
                onOutput={setOutput}
                onError={setError}
                onLoading={setLoading}
              />
            )}
            
            {scenarioType === 'surfaces' && (
              <SurfaceScenario
                positions={positions}
                market={market}
                onOutput={setOutput}
                onError={setError}
                onLoading={setLoading}
              />
            )}
          </div>
          */}
        </div>

        {/* RIGHT COLUMN - OUTPUTS */}
        <div className={styles.outputsColumn}>
          {/* TODO: Enable market context later
          <MarketContext
            spot={market.spot}
            volatility={market.volatility}
            rate={market.rate}
            dividendYield={market.dividend_yield ?? 0}
            today="2026-01-22"
            expiryDate={positions.length > 0 ? positions[0].expiry : '2026-06-19'}
            symbolName={positions.length > 0 ? positions[0].symbol : 'Underlying'}
          />
          */}

          {/* Strategy Timeline - Main visualization */}
          <div className={styles.timelineWrapper}>
            <StrategyTimeline
              positions={positions}
              market={market}
              symbolName={positions.length > 0 ? positions[0].symbol : 'Underlying'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
