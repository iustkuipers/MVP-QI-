/**
 * Type guard and validation functions
 */

import { BacktestResponse } from '../api/types';

/**
 * Check if value is a valid BacktestResponse
 */
export function isBacktestResponse(value: unknown): value is BacktestResponse {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;
  return (
    typeof obj.success === 'boolean' &&
    typeof obj.series === 'object' &&
    typeof obj.portfolio_metrics === 'object' &&
    Array.isArray(obj.issues)
  );
}

/**
 * Check if array is empty
 */
export function isEmpty(arr: unknown[]): boolean {
  return !Array.isArray(arr) || arr.length === 0;
}

/**
 * Check if object has required keys
 */
export function hasKeys<T extends Record<string, unknown>>(
  obj: unknown,
  keys: (keyof T)[]
): obj is T {
  if (!obj || typeof obj !== 'object') return false;
  return keys.every(key => key in obj);
}
