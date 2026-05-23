/**
 * Exponential backoff calculator for WebSocket reconnection.
 *
 * Attempt → Delay
 *   1     → 1s
 *   2     → 2s
 *   3     → 4s
 *   4     → 8s
 *   5     → 16s
 *   6+    → 30s (capped)
 *
 * Also adds ±500ms jitter to prevent thundering herd
 * (multiple clients reconnecting at exactly the same time).
 */

const BASE_DELAY_MS  = 1000;   // 1 second
const MAX_DELAY_MS   = 30000;  // 30 seconds cap
const MAX_ATTEMPTS   = 6;      // stop after this many failures
const JITTER_MS      = 500;    // random jitter range

export function getBackoffDelay(attempt: number): number {
  // 2^(attempt-1) * BASE gives: 1s, 2s, 4s, 8s, 16s, 32s...
  const exponential = Math.pow(2, attempt - 1) * BASE_DELAY_MS;

  // Cap at MAX_DELAY_MS
  const capped = Math.min(exponential, MAX_DELAY_MS);

  // Add random jitter: ±500ms
  const jitter = (Math.random() - 0.5) * 2 * JITTER_MS;

  return Math.max(0, Math.round(capped + jitter));
}

export function shouldRetry(attempt: number): boolean {
  return attempt <= MAX_ATTEMPTS;
}

export function getMaxAttempts(): number {
  return MAX_ATTEMPTS;
}

/**
 * Human-readable delay string for UI display.
 * e.g. "2s", "16s", "30s"
 */
export function formatDelay(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return `${seconds}s`;
}