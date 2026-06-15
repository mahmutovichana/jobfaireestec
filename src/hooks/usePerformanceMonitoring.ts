import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type MetricName = "FCP" | "LCP" | "CLS" | "INP";

export interface PerformanceMetric {
  id: string;
  path: string;
  metric_name: MetricName;
  metric_value: number;
  rating: "good" | "needs-improvement" | "poor";
  session_id: string | null;
  user_agent: string | null;
  created_at: string;
}

function getSessionId() {
  const key = "jobfair_perf_session";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  sessionStorage.setItem(key, next);
  return next;
}

function rateMetric(name: MetricName, value: number): PerformanceMetric["rating"] {
  if (name === "CLS") return value <= 0.1 ? "good" : value <= 0.25 ? "needs-improvement" : "poor";
  if (name === "INP") return value <= 200 ? "good" : value <= 500 ? "needs-improvement" : "poor";
  if (name === "LCP") return value <= 2500 ? "good" : value <= 4000 ? "needs-improvement" : "poor";
  return value <= 1800 ? "good" : value <= 3000 ? "needs-improvement" : "poor";
}

export function usePerformanceMonitoring() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window === "undefined" || pathname.startsWith("/dashboard")) return;
    const sessionId = getSessionId();
    const pending = new Map<MetricName, number>();
    const observers: PerformanceObserver[] = [];

    const track = (name: MetricName, value: number) => {
      if (!Number.isFinite(value) || value < 0) return;
      pending.set(name, Number(name === "CLS" ? value.toFixed(4) : value.toFixed(0)));
    };

    const flush = () => {
      if (pending.size === 0) return;
      const payload = Array.from(pending.entries()).map(([metric_name, metric_value]) => ({
        path: pathname,
        metric_name,
        metric_value,
        rating: rateMetric(metric_name, metric_value),
        session_id: sessionId,
        user_agent: navigator.userAgent.slice(0, 500),
      }));
      pending.clear();
      supabase.from("performance_metrics" as any).insert(payload as any).then(() => undefined);
    };

    try {
      const paint = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === "first-contentful-paint") track("FCP", entry.startTime);
        });
      });
      paint.observe({ type: "paint", buffered: true });
      observers.push(paint);

      const lcp = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) track("LCP", last.startTime);
      });
      lcp.observe({ type: "largest-contentful-paint", buffered: true });
      observers.push(lcp);

      let cls = 0;
      const layoutShift = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) cls += entry.value;
        });
        track("CLS", cls);
      });
      layoutShift.observe({ type: "layout-shift", buffered: true });
      observers.push(layoutShift);

      if (PerformanceObserver.supportedEntryTypes?.includes("event")) {
        const inp = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.interactionId) track("INP", entry.duration);
          });
        });
        inp.observe({ type: "event", buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
        observers.push(inp);
      }
    } catch {
      return undefined;
    }

    const timeout = window.setTimeout(flush, 10000);
    window.addEventListener("pagehide", flush);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("pagehide", flush);
      flush();
      observers.forEach((observer) => observer.disconnect());
    };
  }, [pathname]);
}

export function usePerformanceMetrics(days = 7) {
  return useQuery({
    queryKey: ["performance-metrics", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("performance_metrics" as any)
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) return [];
      return (data ?? []) as unknown as PerformanceMetric[];
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function usePerformanceSummary(metrics: PerformanceMetric[]) {
  return useMemo(() => {
    const byMetric = new Map<MetricName, PerformanceMetric[]>();
    metrics.forEach((metric) => {
      byMetric.set(metric.metric_name, [...(byMetric.get(metric.metric_name) ?? []), metric]);
    });
    return (["LCP", "FCP", "CLS", "INP"] as MetricName[]).map((name) => {
      const values = byMetric.get(name) ?? [];
      const avg = values.length ? values.reduce((sum, m) => sum + m.metric_value, 0) / values.length : 0;
      return { name, avg, count: values.length, rating: rateMetric(name, avg) };
    });
  }, [metrics]);
}