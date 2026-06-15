/**
 * Central React Query tuning. Values can be tweaked via Vite env vars without
 * touching code, e.g. `VITE_QUERY_STALE_MS=120000`.
 */
const num = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const env = (import.meta as any).env ?? {};

export const QUERY_CONFIG = {
  /** How long a query result is considered fresh (no refetch). */
  staleTime: num(env.VITE_QUERY_STALE_MS, 60_000),
  /** How long unused query data stays in memory cache. */
  gcTime: num(env.VITE_QUERY_GC_MS, 15 * 60_000),
  /** Number of automatic retry attempts on failed queries. */
  retry: num(env.VITE_QUERY_RETRY, 1),
  /** Stale time for slowly-changing public data (partners, news, packages). */
  publicStaleTime: num(env.VITE_QUERY_PUBLIC_STALE_MS, 5 * 60_000),
  /** Stale time for nearly-static reference data (package types, team roster). */
  referenceStaleTime: num(env.VITE_QUERY_REFERENCE_STALE_MS, 10 * 60_000),
  /** Delay before kicking off background prefetches. */
  prefetchDelayMs: num(env.VITE_PREFETCH_DELAY_MS, 1200),
} as const;

export type QueryConfig = typeof QUERY_CONFIG;
