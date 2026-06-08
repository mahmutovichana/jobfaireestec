// Microsoft Clarity heatmap & session recording
// Set VITE_CLARITY_PROJECT_ID in your .env (or replace below) to enable.

export const CLARITY_PROJECT_ID =
  (import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined) || "";

export function initClarity() {
  if (!CLARITY_PROJECT_ID || typeof window === "undefined") return;
  if ((window as any).clarity) return;
  (function (c: any, l: any, a: any, r: any, i: any) {
    c[a] = c[a] || function () {
      (c[a].q = c[a].q || []).push(arguments);
    };
    const t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    const y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", CLARITY_PROJECT_ID);
}