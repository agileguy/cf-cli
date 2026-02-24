import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as profileRun } from "../../src/commands/user/billing/profile.js";
import { run as historyRun } from "../../src/commands/user/billing/history.js";
import { run as routerRun } from "../../src/commands/user/billing/index.js";

function sampleBillingProfile(): Record<string, unknown> {
  return {
    id: "billing-123",
    first_name: "Test",
    last_name: "User",
    company: "Test Corp",
    address: "123 Main St",
    city: "Testville",
    state: "TS",
    zipcode: "12345",
    country: "US",
    telephone: "+1-555-0100",
    card_number: "xxxx-1234",
    payment_gateway: "stripe",
    payment_email: "test@example.com",
    type: "personal",
    created_on: "2024-01-01T00:00:00.000Z",
  };
}

function sampleBillingHistory(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "bh-uuid-123",
    type: "charge",
    action: "subscription",
    description: "Monthly subscription charge",
    occurred_at: "2024-06-01T00:00:00.000Z",
    amount: 20.00,
    currency: "USD",
    ...overrides,
  };
}

describe("user billing profile", () => {
  test("gets billing profile", async () => {
    const profile = sampleBillingProfile();
    const { ctx, output } = createTestContext({
      get: async () => profile,
    });

    await profileRun([], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("Test User");
    expect(output.captured.details[0]!["Company"]).toBe("Test Corp");
  });

  test("handles missing optional fields", async () => {
    const { ctx, output } = createTestContext({
      get: async () => ({ id: "billing-123" }),
    });

    await profileRun([], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("-");
  });
});

describe("user billing history", () => {
  test("lists billing history", async () => {
    const entries = [sampleBillingHistory(), sampleBillingHistory({ id: "bh-2", amount: 50 })];
    const { ctx, output } = createTestContext({
      get: async () => entries,
    });

    await historyRun([], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("passes pagination params", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        capturedParams = params;
        return [];
      },
    });

    await historyRun(["--page", "2", "--per-page", "10"], ctx);

    expect(capturedParams!["page"]).toBe("2");
    expect(capturedParams!["per_page"]).toBe("10");
  });
});

describe("user billing router", () => {
  test("routes to profile", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleBillingProfile(),
    });
    await routerRun(["profile"], ctx);
    expect(output.captured.details).toHaveLength(1);
  });

  test("routes to history", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["history"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown billing command");
  });
});
