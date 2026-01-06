/**
 * Comparison & Run Link Utilities
 * 
 * Encodes/decodes comparison state OR single-run state into URL-safe strings
 * Uses LZ compression (via CDN) with base64 fallback
 * 
 * State is encoded as inputs only (configs), not outputs (results)
 * This ensures:
 * - Determinism (same inputs always give same results)
 * - Forward compatibility (engine improvements work transparently)
 * - Short URLs (compressed)
 */

import { BacktestRequest } from '../api/types';

export interface RunState {
  mode: 'single';
  config: BacktestRequest;
}

export interface ComparisonState {
  mode: 'compare';
  configA: BacktestRequest;
  configB: BacktestRequest;
}

export type ShareableState = RunState | ComparisonState;

/**
 * Simple base64 compression (fallback)
 * Not as good as lz-string but works without external deps
 */
function deflate(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function inflate(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

/**
 * Sanitize a config before encoding
 * 
 * Removes undefined/null fields, normalizes ordering
 */
function sanitizeConfig(config: BacktestRequest): BacktestRequest {
  return {
    start_date: config.start_date,
    end_date: config.end_date,
    initial_cash: config.initial_cash,
    positions: [...(config.positions || [])].sort(
      (a, b) => a.ticker.localeCompare(b.ticker)
    ),
    risk_free_rate: config.risk_free_rate,
    benchmark_ticker: config.benchmark_ticker || undefined,
    rebalance: config.rebalance,
    fractional_shares: config.fractional_shares,
    risk_free_compounding: config.risk_free_compounding,
    data_provider: config.data_provider,
  };
}

/**
 * Encode shareable state (run or comparison) into URL-safe string
 * 
 * Tries lz-string compression from CDN, falls back to base64
 */
export async function encodeState(state: ShareableState): Promise<string> {
  // Sanitize configs
  const sanitized =
    state.mode === 'single'
      ? {
          mode: 'single' as const,
          config: sanitizeConfig(state.config),
        }
      : {
          mode: 'compare' as const,
          configA: sanitizeConfig(state.configA),
          configB: sanitizeConfig(state.configB),
        };

  const jsonString = JSON.stringify(sanitized);

  // Try to use lz-string from CDN if available
  try {
    // Check if lz is already loaded (from CDN)
    if (typeof (window as any).LZ !== 'undefined') {
      const compressed = (window as any).LZ.compressToEncodedURIComponent(jsonString);
      if (compressed && compressed.length > 0) {
        return `lz_${compressed}`;
      }
    }
  } catch (e) {
    console.warn('LZ compression unavailable, using base64 fallback');
  }

  // Fallback: simple base64 encoding
  return `b64_${deflate(jsonString)}`;
}

/**
 * Decode shareable state (run or comparison) from URL-safe string
 * 
 * Validates shape and handles corruption gracefully
 */
export async function decodeState(encoded: string): Promise<ShareableState | null> {
  try {
    let jsonString: string;

    // Check prefix and decode accordingly
    if (encoded.startsWith('lz_')) {
      const compressed = encoded.slice(3);
      try {
        if (typeof (window as any).LZ !== 'undefined') {
          jsonString = (window as any).LZ.decompressFromEncodedURIComponent(compressed);
        } else {
          // LZ not available, fallback to base64 (this shouldn't happen but just in case)
          jsonString = inflate(compressed);
        }
      } catch (e) {
        console.warn('LZ decompression failed, trying base64');
        jsonString = inflate(compressed);
      }
    } else if (encoded.startsWith('b64_')) {
      jsonString = inflate(encoded.slice(4));
    } else {
      // Legacy: assume base64
      jsonString = inflate(encoded);
    }

    if (!jsonString) {
      console.warn('Failed to decode string');
      return null;
    }

    const state = JSON.parse(jsonString);

    // Validate shape
    if (state.mode === 'single') {
      if (!state.config || typeof state.config !== 'object') {
        console.warn('Invalid single run state shape');
        return null;
      }
      return state as RunState;
    } else if (state.mode === 'compare') {
      if (
        !state.configA ||
        !state.configB ||
        typeof state.configA !== 'object' ||
        typeof state.configB !== 'object'
      ) {
        console.warn('Invalid comparison state shape');
        return null;
      }
      return state as ComparisonState;
    } else {
      console.warn('Unknown state mode');
      return null;
    }
  } catch (e) {
    console.warn('Failed to decode state:', e);
    return null;
  }
}

/**
 * Build shareable link from state (run or comparison)
 */
export async function buildShareableLink(state: ShareableState): Promise<string> {
  const encoded = await encodeState(state);
  const baseUrl = window.location.origin;
  const pathname = window.location.pathname.includes('/portfolio-lab')
    ? '/portfolio-lab'
    : '/';
  return `${baseUrl}${pathname}?state=${encoded}`;
}

/**
 * Legacy: Build comparison link (for backward compatibility)
 */
export async function buildComparisonLink(state: ComparisonState): Promise<string> {
  return buildShareableLink(state);
}

/**
 * Build shareable link for a single backtest run
 */
export async function buildRunLink(config: BacktestRequest): Promise<string> {
  const state: RunState = { mode: 'single', config };
  return buildShareableLink(state);
}

/**
 * Restore state from URL parameter (handles both single and comparison modes)
 */
export async function restoreStateFromUrl(): Promise<ShareableState | null> {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('state');
  if (!encoded) return null;

  return decodeState(encoded);
}

/**
 * Legacy: Extract comparison state from URL (for backward compatibility)
 */
export async function restoreComparisonFromUrl(): Promise<ComparisonState | null> {
  const state = await restoreStateFromUrl();
  if (state && state.mode === 'compare') {
    return state;
  }
  return null;
}

/**
 * Copy text to clipboard with feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.error('Failed to copy to clipboard:', e);
    return false;
  }
}
