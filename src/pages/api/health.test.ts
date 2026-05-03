import { describe, expect, it } from "vitest";

import { GET } from "./health";

describe("GET /api/health", () => {
  it("returns a healthy JSON payload", async () => {
    const response = await GET({} as never);

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      service: "blog2",
    });
  });
});
