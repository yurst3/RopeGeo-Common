/**
 * Network-only helpers safe for browsers and React Native (no Node `fs`, no AWS S3/SQS in this graph).
 * Published as `ropegeo-common/helpers/network`. Prefer this entry over `ropegeo-common/helpers` in
 * Metro/RN bundles so the full helpers barrel (S3 folder upload, etc.) is not resolved.
 */

export {
  NETWORK_REQUEST_DEFAULT_TIMEOUT_SECONDS,
  NETWORK_REQUEST_HARD_TIMEOUT_MS,
  NETWORK_REQUEST_TIMED_OUT_MESSAGE,
  installNetworkRequestPolicyTimers,
  isAbortError,
  isNetworkRequestTimeoutError,
  mergeParentSignalWithDeadline,
  resolveRequestTimeoutMs,
  type MergedDeadlineHandles,
  type NetworkRequestPolicyTimerCallbacks,
} from "./networkRequestPolicy";
