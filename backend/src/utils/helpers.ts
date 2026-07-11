/** Simulates network latency found in real production backends. */
export function simulateDelay(ms = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Format a standardised API error body. */
export function apiError(
  status: number,
  message: string,
  details?: unknown,
): { status: number; message: string; details?: unknown } {
  return { status, message, ...(details ? { details } : {}) };
}
