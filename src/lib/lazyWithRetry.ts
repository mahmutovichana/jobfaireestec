import { lazy, type ComponentType } from "react";

/**
 * `React.lazy` wrapper that recovers from stale chunk URLs after a redeploy.
 * If a dynamic import fails (typically `Failed to fetch dynamically imported module`),
 * we hard-reload the page once so the user picks up the latest manifest instead of
 * seeing a permanently broken route.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    const RELOAD_KEY = "__chunk_reload_attempted__";
    try {
      const mod = await factory();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(RELOAD_KEY);
      }
      return mod;
    } catch (err) {
      if (typeof window !== "undefined") {
        const alreadyReloaded = window.sessionStorage.getItem(RELOAD_KEY);
        if (!alreadyReloaded) {
          window.sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
          // Block the suspense fallback render until the reload kicks in.
          return await new Promise<{ default: T }>(() => {});
        }
      }
      throw err;
    }
  });
}
