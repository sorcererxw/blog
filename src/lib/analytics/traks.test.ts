import { afterEach, describe, expect, it, vi } from "vitest";

import {
  TRAKS_QUEUE_INIT_SCRIPT,
  TRAKS_SCRIPT_SRC,
  TRAKS_SITE_KEY,
  trackTraks404,
  trackTraksEvent,
} from "./traks";

describe("traks analytics helper", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exports the configured collector script and site key", () => {
    expect(TRAKS_SITE_KEY).toBe("pb_live_f6911j6tsl00mm9e1e0v5m3i");
    expect(TRAKS_SCRIPT_SRC).toBe("https://traks-collect.xw.workers.dev/t.js");
    expect(TRAKS_QUEUE_INIT_SCRIPT).toContain("window.traks");
  });

  it("forwards custom events and 404 events to window.traks", () => {
    const traks = vi.fn();
    vi.stubGlobal("window", {
      location: { pathname: "/missing-page" },
      traks,
    });

    trackTraksEvent("newsletter_click", { source: "footer" }, 1);
    trackTraks404();

    expect(traks).toHaveBeenNthCalledWith(
      1,
      "newsletter_click",
      { source: "footer" },
      1,
    );
    expect(traks).toHaveBeenNthCalledWith(
      2,
      "404",
      { path: "/missing-page" },
      undefined,
    );
  });

  it("no-ops safely without window or window.traks", () => {
    expect(() => trackTraks404("/missing")).not.toThrow();

    vi.stubGlobal("window", { location: { pathname: "/missing" } });
    expect(() => trackTraks404()).not.toThrow();
  });
});
