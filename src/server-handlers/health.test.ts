import { describe, expect, it } from "vitest";

import { handleHealthRequest } from "./health";

describe("GET /api/health", () => {
  it("returns a healthy JSON payload", async () => {
    const response = await handleHealthRequest();

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      service: "blog2",
    });
  });
});
