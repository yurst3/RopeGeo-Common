/**
 * Defaults for HTTP wrappers and other network clients (see plan: mobile-network-resilience).
 * Apps may pass their own deadline via `timeoutAfterSeconds` on components; when omitted,
 * {@link NETWORK_REQUEST_DEFAULT_TIMEOUT_SECONDS} applies.
 */

export const NETWORK_REQUEST_DEFAULT_TIMEOUT_SECONDS = 30;

export const NETWORK_REQUEST_HARD_TIMEOUT_MS =
  NETWORK_REQUEST_DEFAULT_TIMEOUT_SECONDS * 1_000;

/** Use when showing “slow network” UI before the full countdown is surfaced (e.g. toasts). */
export const NETWORK_REQUEST_SLOW_THRESHOLD_MS = 15_000;

/** Use this exact message so callers can detect timeout vs other failures. */
export const NETWORK_REQUEST_TIMED_OUT_MESSAGE = "Network request timed out";

export function isNetworkRequestTimeoutError(e: unknown): boolean {
  return e instanceof Error && e.message === NETWORK_REQUEST_TIMED_OUT_MESSAGE;
}

export function isAbortError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === "AbortError") return true;
  if (e instanceof Error && e.name === "AbortError") return true;
  return false;
}

/** Milliseconds for `timeoutAfterSeconds` on request components, or the package default. */
export function resolveRequestTimeoutMs(timeoutAfterSeconds?: number): number {
  if (
    timeoutAfterSeconds != null &&
    Number.isFinite(timeoutAfterSeconds) &&
    timeoutAfterSeconds > 0
  ) {
    return Math.floor(timeoutAfterSeconds) * 1_000;
  }
  return NETWORK_REQUEST_HARD_TIMEOUT_MS;
}

export type NetworkRequestPolicyTimerCallbacks = {
  isActive: () => boolean;
  onTimeoutCountdown: (secondsRemaining: number) => void;
  onClearTimeoutCountdown: () => void;
  onHardTimeout: () => void;
};

/**
 * Emits whole seconds until {@link hardTimeoutMs} on install and roughly every second after
 * (from ~full duration down to 1), then fires {@link NetworkRequestPolicyTimerCallbacks.onHardTimeout}
 * at the deadline. Clears countdown on hard timeout or cleanup. Does not emit 0.
 */
export function installNetworkRequestPolicyTimers(
  requestStartedAtMs: number,
  hardTimeoutMs: number,
  callbacks: NetworkRequestPolicyTimerCallbacks
): () => void {
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const clearCountdown = () => {
    if (intervalId != null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    callbacks.onClearTimeoutCountdown();
  };

  const tick = () => {
    if (!callbacks.isActive()) return;
    const elapsed = Date.now() - requestStartedAtMs;
    const remainingMs = hardTimeoutMs - elapsed;
    if (remainingMs <= 500) return;
    const secs = Math.max(1, Math.ceil(remainingMs / 1_000));
    callbacks.onTimeoutCountdown(secs);
  };

  tick();
  intervalId = setInterval(tick, 1_000);

  const hardId = setTimeout(() => {
    clearCountdown();
    if (callbacks.isActive()) callbacks.onHardTimeout();
  }, hardTimeoutMs);

  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    clearTimeout(hardId);
    if (intervalId != null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    callbacks.onClearTimeoutCountdown();
  };
}

export type MergedDeadlineHandles = {
  signal: AbortSignal;
  dispose: () => void;
  consumeDidTimeout: () => boolean;
};

/**
 * Aborts `signal` when `parentSignal` aborts or when `deadlineMs` elapses (whichever comes first).
 * Call `dispose()` after the request settles to clear the timer; then `consumeDidTimeout()` to see
 * whether the deadline fired (vs parent abort only).
 */
export function mergeParentSignalWithDeadline(
  parentSignal: AbortSignal,
  deadlineMs: number = NETWORK_REQUEST_HARD_TIMEOUT_MS
): MergedDeadlineHandles {
  const controller = new AbortController();
  let didTimeout = false;

  const onParentAbort = () => {
    clearTimeout(timeoutId);
    if (!controller.signal.aborted) controller.abort();
  };

  let timeoutId = setTimeout(() => {
    didTimeout = true;
    parentSignal.removeEventListener("abort", onParentAbort);
    if (!controller.signal.aborted) controller.abort();
  }, deadlineMs);

  if (parentSignal.aborted) {
    clearTimeout(timeoutId);
    if (!controller.signal.aborted) controller.abort();
  } else {
    parentSignal.addEventListener("abort", onParentAbort, { once: true });
  }

  let mergedDisposed = false;
  return {
    signal: controller.signal,
    dispose: () => {
      if (mergedDisposed) return;
      mergedDisposed = true;
      clearTimeout(timeoutId);
      parentSignal.removeEventListener("abort", onParentAbort);
    },
    consumeDidTimeout: () => {
      const v = didTimeout;
      didTimeout = false;
      return v;
    },
  };
}
