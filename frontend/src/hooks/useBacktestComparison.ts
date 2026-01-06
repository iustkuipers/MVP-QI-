/**
 * useBacktestComparison - Manage single and comparison backtest states
 * 
 * Orchestrates two independent backtests
 * Switches mode automatically when second result available
 */

import { useState, useCallback } from 'react';
import { runBacktest } from '../api/backtest';
import { adaptBacktest } from '../adapters/backtestAdapter';

type AdaptedData = ReturnType<typeof adaptBacktest>;

interface BacktestRun {
  label: string;
  data: AdaptedData;
}

interface UseBacktestComparisonReturn {
  // Single mode
  singleData: AdaptedData | null;
  singleLoading: boolean;
  singleError: Error | null;
  singleLabel: string;
  setSingleLabel: (label: string) => void;
  runSingle: (payload: unknown) => Promise<void>;
  clearSingle: () => void;

  // Comparison mode
  comparisonA: BacktestRun | null;
  comparisonB: BacktestRun | null;
  comparisonLoading: boolean;
  comparisonError: Error | null;
  setComparisonALabel: (label: string) => void;
  setComparisonBLabel: (label: string) => void;
  runComparisonA: (payload: unknown) => Promise<void>;
  runComparisonB: (payload: unknown) => Promise<void>;
  addComparison: () => void;
  clearComparison: () => void;

  // Mode toggle
  mode: 'single' | 'compare';
  setMode: (mode: 'single' | 'compare') => void;
}

export function useBacktestComparison(): UseBacktestComparisonReturn {
  // Single mode state
  const [singleData, setSingleData] = useState<AdaptedData | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState<Error | null>(null);
  const [singleLabel, setSingleLabel] = useState('Current Run');

  // Comparison mode state
  const [comparisonA, setComparisonA] = useState<BacktestRun | null>(null);
  const [comparisonB, setComparisonB] = useState<BacktestRun | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<Error | null>(null);

  // Mode
  const [mode, setMode] = useState<'single' | 'compare'>('single');

  // Single mode operations
  const runSingle = useCallback(async (payload: unknown) => {
    setSingleLoading(true);
    setSingleError(null);

    try {
      const response = await runBacktest(payload);
      const adapted = adaptBacktest(response);
      setSingleData(adapted);
    } catch (err) {
      setSingleError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setSingleLoading(false);
    }
  }, []);

  const clearSingle = useCallback(() => {
    setSingleData(null);
    setSingleLoading(false);
    setSingleError(null);
  }, []);

  // Comparison mode operations
  const runComparisonA = useCallback(async (payload: unknown) => {
    setComparisonLoading(true);
    setComparisonError(null);

    try {
      const response = await runBacktest(payload);
      const adapted = adaptBacktest(response);
      setComparisonA({
        label: 'Portfolio A',
        data: adapted,
      });
    } catch (err) {
      setComparisonError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setComparisonLoading(false);
    }
  }, []);

  const runComparisonB = useCallback(async (payload: unknown) => {
    setComparisonLoading(true);
    setComparisonError(null);

    try {
      const response = await runBacktest(payload);
      const adapted = adaptBacktest(response);
      setComparisonB({
        label: 'Portfolio B',
        data: adapted,
      });
      // Auto-switch to compare mode when both results available
      if (comparisonA) {
        setMode('compare');
      }
    } catch (err) {
      setComparisonError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setComparisonLoading(false);
    }
  }, [comparisonA]);

  const addComparison = useCallback(() => {
    if (singleData) {
      setComparisonA({
        label: 'Portfolio A',
        data: singleData,
      });
      setSingleData(null);
    }
  }, [singleData]);

  const clearComparison = useCallback(() => {
    setComparisonA(null);
    setComparisonB(null);
    setComparisonLoading(false);
    setComparisonError(null);
    setMode('single');
  }, []);

  return {
    // Single mode
    singleData,
    singleLoading,
    singleError,
    singleLabel,
    setSingleLabel,
    runSingle,
    clearSingle,

    // Comparison mode
    comparisonA,
    comparisonB,
    comparisonLoading,
    comparisonError,
    setComparisonALabel: (label: string) =>
      setComparisonA(prev => prev ? { ...prev, label } : null),
    setComparisonBLabel: (label: string) =>
      setComparisonB(prev => prev ? { ...prev, label } : null),
    runComparisonA,
    runComparisonB,
    addComparison,
    clearComparison,

    // Mode toggle
    mode,
    setMode,
  };
}
