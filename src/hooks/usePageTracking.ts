import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function getReferrerDomain(referrer: string): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.hostname === window.location.hostname) return null;
    return url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function usePageTracking() {
  const { pathname } = useLocation();
  const lastPath = useRef<string | null>(null);
  const initialReferrer = useRef<string>(document.referrer || "");

  useEffect(() => {
    // Skip dashboard / auth — track only public pages
    if (pathname.startsWith("/dashboard") || pathname === "/auth") return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const referrer = initialReferrer.current;
    const referrerDomain = getReferrerDomain(referrer);

    // Defer the insert until the browser is idle — it must never compete
    // with critical-path requests for LCP.
    const send = () => {
      supabase.from("page_views").insert({
        path: pathname,
        referrer: referrer || null,
        referrer_domain: referrerDomain,
        user_agent: navigator.userAgent.slice(0, 500),
      }).then(() => {
        initialReferrer.current = "";
      });
    };
    const ric = (window as any).requestIdleCallback as
      | undefined
      | ((cb: () => void, o?: { timeout?: number }) => number);
    const cancel = (window as any).cancelIdleCallback as
      | undefined
      | ((id: number) => void);
    if (ric) {
      const id = ric(send, { timeout: 4000 });
      return () => cancel?.(id);
    }
    const t = window.setTimeout(send, 2000);
    return () => window.clearTimeout(t);
  }, [pathname]);
}