export const TRAKS_SITE_KEY = "pb_live_f6911j6tsl00mm9e1e0v5m3i";

export const TRAKS_SCRIPT_SRC = "https://traks-collect.xw.workers.dev/t.js";

export const TRAKS_QUEUE_INIT_SCRIPT =
  "window.traks=window.traks||function(){(window.traks.q=window.traks.q||[]).push(arguments)}";

type TraksEventProps = Record<string, string | number | boolean | null>;

type TraksFn = ((
  eventName: string,
  props?: TraksEventProps,
  value?: number,
) => void) & {
  q?: unknown[][];
};

declare global {
  interface Window {
    traks?: TraksFn;
  }
}

export function trackTraksEvent(
  eventName: string,
  props?: TraksEventProps,
  value?: number,
): void {
  if (typeof window === "undefined" || typeof window.traks !== "function") {
    return;
  }

  window.traks(eventName, props, value);
}

export function trackTraks404(path?: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const targetPath = (path ?? window.location.pathname).slice(0, 500);
  trackTraksEvent("404", { path: targetPath });
}
