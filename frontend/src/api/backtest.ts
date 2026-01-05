/**
 * Backtest API endpoints
 */

import { BacktestResponse } from './types';
import { apiClient } from './client';

export async function runBacktest(payload: unknown): Promise<BacktestResponse> {
  const res = await apiClient.post<BacktestResponse>('/api/v1/backtest', payload);
  return res;
}
