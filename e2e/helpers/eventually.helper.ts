import { setTimeout as sleep } from 'node:timers/promises';

export interface EventuallyOptions {
  /** Total time budget before failing. Keep it below the Jest testTimeout. */
  timeoutMs?: number;
  /** Delay between two probes. */
  intervalMs?: number;
  /** Shown in the failure message to say what was awaited. */
  description?: string;
}

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_INTERVAL_MS = 200;

/**
 * Polls `probe` until `predicate` accepts its result, for assertions on eventually
 * consistent state produced by the async pipeline (outbox -> Redis -> post-processor).
 * Never replace it with a fixed sleep: the test then waits as long as the pipeline needs, no more.
 * A probe that throws is retried; its last error is reported on timeout.
 */
export async function eventually<T>(
  probe: () => Promise<T>,
  predicate: (value: T) => boolean,
  options: EventuallyOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const deadline = Date.now() + timeoutMs;
  let lastValue: T | undefined;
  let lastError: unknown;

  for (;;) {
    try {
      lastValue = await probe();
      lastError = undefined;
      if (predicate(lastValue)) {
        return lastValue;
      }
    } catch (error: unknown) {
      lastError = error;
    }

    if (Date.now() + intervalMs > deadline) {
      const observed =
        lastError !== undefined
          ? `last error: ${lastError instanceof Error ? lastError.message : JSON.stringify(lastError)}`
          : `last value: ${JSON.stringify(lastValue)}`;
      throw new Error(
        `eventually: "${options.description ?? 'condition'}" not met after ${String(timeoutMs)} ms (${observed})`,
      );
    }
    await sleep(intervalMs);
  }
}
