import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as listRun } from "../../src/commands/accounts/subscriptions/list.js";
import { run as getRun } from "../../src/commands/accounts/subscriptions/get.js";
import { run as routerRun } from "../../src/commands/accounts/subscriptions/index.js";

function sampleSubscription(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "sub-uuid-123",
    rate_plan: { id: "free", public_name: "Free Plan", currency: "USD", scope: "zone" },
    price: 0,
    currency: "USD",
    frequency: "monthly",
    state: "active",
    current_period_start: "2024-01-01T00:00:00.000Z",
    current_period_end: "2024-02-01T00:00:00.000Z",
    created_on: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("accounts subscriptions list", () => {
  test("lists subscriptions for an account", async () => {
    const subs = [sampleSubscription(), sampleSubscription({ id: "sub-2", state: "trial" })];
    const { ctx, output } = createTestContext({
      get: async () => subs,
    });

    await listRun(["--account-id", "abc123"], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("resolves account ID from config", async () => {
    let capturedPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        capturedPath = path;
        if (path === "/accounts") return [{ id: "auto-account" }];
        return [];
      },
    });

    await listRun([], ctx);

    expect(capturedPath).toContain("auto-account");
  });
});

describe("accounts subscriptions get", () => {
  test("gets subscription details", async () => {
    const sub = sampleSubscription();
    const { ctx, output } = createTestContext({
      get: async () => sub,
    });

    await getRun(["--account-id", "abc123", "--id", "sub-uuid-123"], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Plan"]).toBe("Free Plan");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext({
      get: async () => [{ id: "auto-account" }],
    });
    expect(getRun(["--account-id", "abc123"], ctx)).rejects.toThrow("--id");
  });
});

describe("accounts subscriptions router", () => {
  test("routes to list", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["list", "--account-id", "abc123"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown subscriptions command");
  });
});
