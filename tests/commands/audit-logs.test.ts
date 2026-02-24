import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as listRun } from "../../src/commands/audit-logs/list.js";
import { run as routerRun } from "../../src/commands/audit-logs/index.js";

function sampleAuditLog(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "audit-uuid-123",
    action: { type: "zone.create", result: true },
    actor: { id: "user-123", email: "admin@example.com", ip: "1.2.3.4", type: "user" },
    resource: { id: "zone-123", type: "zone" },
    when: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("audit-logs list", () => {
  test("lists audit logs for an account", async () => {
    const logs = [sampleAuditLog(), sampleAuditLog({ id: "audit-2" })];
    const { ctx, output } = createTestContext({
      get: async () => logs,
    });

    await listRun(["--account-id", "abc123"], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("passes filter params", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        capturedParams = params;
        return [];
      },
    });

    await listRun([
      "--account-id", "abc123",
      "--user-email", "admin@example.com",
      "--action-type", "zone.create",
      "--resource-type", "zone",
      "--from", "2024-01-01",
      "--to", "2024-06-01",
      "--direction", "desc",
      "--per-page", "50",
    ], ctx);

    expect(capturedParams!["actor.email"]).toBe("admin@example.com");
    expect(capturedParams!["action.type"]).toBe("zone.create");
    expect(capturedParams!["resource.type"]).toBe("zone");
    expect(capturedParams!["since"]).toBe("2024-01-01");
    expect(capturedParams!["before"]).toBe("2024-06-01");
    expect(capturedParams!["direction"]).toBe("desc");
    expect(capturedParams!["per_page"]).toBe("50");
  });

  test("resolves account ID from API", async () => {
    let capturedPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        capturedPath = path;
        if (path === "/accounts") return [{ id: "auto-acct" }];
        return [];
      },
    });

    await listRun([], ctx);

    expect(capturedPath).toContain("auto-acct");
  });
});

describe("audit-logs router", () => {
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
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown audit-logs command");
  });
});
