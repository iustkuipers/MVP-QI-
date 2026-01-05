/**
 * useBacktest Hook
 * Manages backtest execution and state
 */

import { useState, useCallback } from 'react';
import { BacktestRequest } from '../api/types';
import { runBacktest } from '../api/backtest';
import { adaptBacktest } from '../adapters/backtestAdapter';

type AdaptedData = ReturnType<typeof adaptBacktest>;

interface UseBacktestReturn {
  data: AdaptedData | null;
  loading: boolean;
  error: Error | null;
  run: (payload: unknown) => Promise<void>;
  clear: () => void;
}

export function useBacktest(): UseBacktestReturn {
  const [data, setData] = useState<AdaptedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(async (payload: unknown) => {
    setLoading(true);
    setError(null);

    try {
      const response = await runBacktest(payload);
      const adapted = adaptBacktest(response);
      setData(adapted);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    run,
    clear,
  };
}
