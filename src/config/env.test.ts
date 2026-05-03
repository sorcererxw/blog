import { describe, expect, it } from "vitest";

import { getRequiredEnv } from "./env";

describe("getRequiredEnv", () => {
  it("throws when a required env var is missing", () => {
    expect(() => getRequiredEnv("NOTION_TOKEN", {} as never)).toThrow(
      "Missing required environment variable: NOTION_TOKEN",
    );
  });
});
