import { test, expect } from "@playwright/test";

test("backend health", async ({ request }) => {
  const r = await request.get("http://127.0.0.1:10783/api/health");
  expect(r.ok()).toBeTruthy();
  const j = await r.json();
  expect(j.service).toBe("notebooklm-fleet-mcp");
});
