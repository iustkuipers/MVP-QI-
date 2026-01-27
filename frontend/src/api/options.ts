/**
 * Options API client
 */

import { apiClient } from './client';

export interface OptionPosition {
  symbol: string;
  type?: 'call' | 'put' | 'stock'; // optional for stocks
  entry_date?: string; // when position was opened
  entry_price?: number; // premium paid/received
  strike?: number; // optional for stocks
  expiry?: string; // optional for stocks
  style?: 'european' | 'american';
  quantity: number;
}

export interface MarketSnapshot {
  spot: number;
  rate: number;
  volatility: number;
  dividend_yield?: number;
  utility_type?: 'risk-neutral' | 'crra' | 'cara';
  crra_gamma?: number;
  cara_a?: number;
}

export interface MonteCarloResponse {
  summary: {
    mean: number;
    std: number;
    min: number;
    max: number;
  };
  percentiles: {
    [key: string]: number;
  };
  tail_risk: {
    var_5: number;
    var_1: number;
    cvar_5: number;
  };
}

export interface CrashScenarioResponse {
  crash_pct: number;
  spot: number;
  value: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface SurfaceResponse {
  value: number[][];
  delta?: number[][];
  gamma?: number[][];
}

export const optionsAPI = {
  async monteCarlo(
    positions: OptionPosition[],
    market: MarketSnapshot,
    today: string,
    horizon_days: number,
    n_sims: number,
    seed?: number
  ): Promise<MonteCarloResponse> {
    const response = await apiClient.post('/api/v1/options/monte-carlo', {
      positions,
      market,
      today,
      horizon_days,
      n_sims,
      seed: seed || undefined,
    });
    return response;
  },

  async crashScenario(
    positions: OptionPosition[],
    market: MarketSnapshot,
    today: string,
    crashes: number[]
  ): Promise<CrashScenarioResponse[]> {
    const response = await apiClient.post('/api/v1/options/crash', {
      positions,
      market,
      today,
      crashes,
    });
    return response;
  },

  async spotVolSurface(
    positions: OptionPosition[],
    market: MarketSnapshot,
    today: string,
    spots: number[],
    vols: number[]
  ): Promise<SurfaceResponse> {
    const response = await apiClient.post('/api/v1/options/spot-vol-surface', {
      positions,
      market,
      today,
      spots,
      vols,
    });
    return response;
  },

  async spotTimeSurface(
    positions: OptionPosition[],
    market: MarketSnapshot,
    today: string,
    spots: number[],
    horizons: number[]
  ): Promise<SurfaceResponse> {
    const response = await apiClient.post('/api/v1/options/spot-time-surface', {
      positions,
      market,
      today,
      spots,
      horizons,
    });
    return response;
  },

  async spotScenario(
    positions: OptionPosition[],
    market: MarketSnapshot,
    today: string,
    spots: number[]
  ): Promise<any[]> {
    const response = await apiClient.post('/api/v1/options/spot-scenario', {
      positions,
      market,
      today,
      spots,
    });
    return response;
  },

  async volScenario(
    positions: OptionPosition[],
    market: MarketSnapshot,
    today: string,
    vols: number[]
  ): Promise<any[]> {
    const response = await apiClient.post('/api/v1/options/vol-scenario', {
      positions,
      market,
      today,
      vols,
    });
    return response;
  },

  async timeScenario(
    positions: OptionPosition[],
    market: MarketSnapshot,
    today: string,
    horizons: number[]
  ): Promise<any[]> {
    const response = await apiClient.post('/api/v1/options/time-scenario', {
      positions,
      market,
      today,
      horizons,
    });
    return response;
  },

  async payoff(request: {
    positions: OptionPosition[];
    market: MarketSnapshot;
    today: string;
    expiry_date: string;
    spot_center: number;
    pct_range: number;
    n_points: number;
    include_value_today: boolean;
    include_greeks_today: boolean;
  }): Promise<any> {
    const response = await apiClient.post('/api/v1/options/payoff', request);
    return response;
  },

  async strategyTimeline(request: {
    positions: OptionPosition[];
    market: MarketSnapshot;
    symbol: string;
    start_date: string;
    end_date: string;
  }): Promise<any> {
    const response = await apiClient.post('/api/v1/options/strategy-timeline', request);
    return response;
  },
};

export default optionsAPI;