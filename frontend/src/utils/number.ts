/**
 * Number formatting utilities
 * Used by panels to display metrics
 */

/**
 * Format number as percentage string
 * 0.0512 → "5.12%"
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format number with thousand separators
 * 12345.67 → "$12,345.67"
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return `$${value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Format number to fixed decimal places
 * 1.23456 → "1.2346" (4 decimals)
 */
export function formatDecimal(value: number, decimals: number = 4): string {
  return value.toFixed(decimals);
}

/**
 * Determine if number is positive or negative for styling
 */
export function getNumberColor(value: number): 'positive' | 'negative' | 'neutral' {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}
