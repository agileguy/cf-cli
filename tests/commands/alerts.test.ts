import { describe, test, expect, spyOn } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as routerRun } from "../../src/commands/alerts/index.js";
import { run as listRun } from "../../src/commands/alerts/list.js";
import { run as getRun } from "../../src/commands/alerts/get.js";
import { run as deleteRun } from "../../src/commands/alerts/delete.js";
import { run as historyRun } from "../../src/commands/alerts/history.js";
import { run as availableRun } from "../../src/commands/alerts/available.js";
import { run as destRouterRun } from "../../src/commands/alerts/destinations/index.js";
import { run as webhooksRun } from "../../src/commands/alerts/destinations/webhooks.js";
import { run as pagerdutyRun } from "../../src/commands/alerts/destinations/pagerduty.js";
import { run as silencesRun } from "../../src/commands/alerts/silences.js";

const prompts = await import("../../src/utils/prompts.js");

const samplePolicy = () => ({
  id: "policy-uuid-123",
  name: "High CPU Alert",
  description: "Alert when CPU > 90%",
  enabled: true,
  alert_type: "real_origin_monitoring",
  mechanisms: { webhooks: [{ id: "wh-1" }] },
  created: "2024-01-01T00:00:00.000Z",
  modified: "2024-06-01T00:00:00.000Z",
});

const sampleWebhook = () => ({
  id: "wh-uuid-123",
  name: "My Webhook",
  url: "https://hooks.example.com/cf",
  created_at: "2024-01-01T00:00:00.000Z",
});

const samplePagerDuty = () => ({
  id: "pd-uuid-123",
  name: "PD Service",
  service_id: "PABC123",
  service_name: "Cloudflare Alerts",
});

const sampleSilence = () => ({
  id: "silence-uuid-123",
  description: "Maintenance window",
  starts_on: "2024-06-01T00:00:00.000Z",
  ends_on: "2024-06-01T06:00:00.000Z",
});

const sampleHistoryEntry = () => ({
  id: "hist-uuid-123",
  name: "CPU Alert Fired",
  alert_type: "real_origin_monitoring",
  mechanism_type: "webhook",
  sent: "2024-06-01T01:00:00.000Z",
});

// Helper: account lookup mock
const accountGet = (returnVal: unknown) => async (path: string) => {
  if (path === "/accounts") return [{ id: "acct-123", name: "Test" }];
  return returnVal;
};

// ─── Router ────────────────────────────────────────────────────────────────

describe("alerts router", () => {
  test("shows help", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("unknown command throws", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown");
  });
});

// ─── Policies CRUD ─────────────────────────────────────────────────────────

describe("alerts list", () => {
  test("returns table of policies", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet([samplePolicy()]),
    });
    await listRun(["--account-id", "acct-123"], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });
});

describe("alerts get", () => {
  test("returns policy details", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet(samplePolicy()),
    });
    await getRun(["--account-id", "acct-123", "--id", "policy-uuid-123"], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("High CPU Alert");
  });

  test("requires --id", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(getRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--id");
  });
});

describe("alerts delete", () => {
  test("requires --id", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(deleteRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--id");
  });

  test("aborts without confirmation", async () => {
    const spy = spyOn(prompts, "confirm").mockResolvedValue(false);
    const { ctx, output } = createTestContext(
      { get: accountGet({}), delete: async () => ({}) },
      { yes: undefined },
    );
    await deleteRun(["--account-id", "acct-123", "--id", "pol-1"], ctx);
    expect(output.captured.warnings[0]).toContain("Aborted");
    spy.mockRestore();
  });

  test("succeeds with confirmation", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet({}),
      delete: async () => ({}),
    });
    await deleteRun(["--account-id", "acct-123", "--id", "pol-1"], ctx);
    expect(output.captured.successes[0]).toContain("deleted");
  });
});

// ─── Destinations ──────────────────────────────────────────────────────────

describe("alerts destinations router", () => {
  test("shows help", async () => {
    const { ctx, output } = createTestContext();
    await destRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("alerts destinations webhooks", () => {
  test("list returns table", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet([sampleWebhook()]),
    });
    await webhooksRun(["list", "--account-id", "acct-123"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("create requires --name and --url", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(webhooksRun(["create", "--account-id", "acct-123"], ctx)).rejects.toThrow("--name");
    expect(webhooksRun(["create", "--account-id", "acct-123", "--name", "wh"], ctx)).rejects.toThrow("--url");
  });

  test("create succeeds", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [{ id: "acct-123" }],
      post: async () => sampleWebhook(),
    });
    await webhooksRun(["create", "--account-id", "acct-123", "--name", "wh", "--url", "https://hooks.test"], ctx);
    expect(output.captured.successes[0]).toContain("Webhook created");
  });

  test("update requires --id", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(webhooksRun(["update", "--account-id", "acct-123"], ctx)).rejects.toThrow("--id");
  });

  test("delete aborts without confirmation", async () => {
    const spy = spyOn(prompts, "confirm").mockResolvedValue(false);
    const { ctx, output } = createTestContext(
      { get: accountGet({}), delete: async () => ({}) },
      { yes: undefined },
    );
    await webhooksRun(["delete", "--account-id", "acct-123", "--id", "wh-1"], ctx);
    expect(output.captured.warnings[0]).toContain("Aborted");
    spy.mockRestore();
  });

  test("shows help", async () => {
    const { ctx, output } = createTestContext();
    await webhooksRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("alerts destinations pagerduty", () => {
  test("list returns table", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet([samplePagerDuty()]),
    });
    await pagerdutyRun(["list", "--account-id", "acct-123"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("connect succeeds", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [{ id: "acct-123" }],
      post: async () => samplePagerDuty(),
    });
    await pagerdutyRun(["connect", "--account-id", "acct-123"], ctx);
    expect(output.captured.successes[0]).toContain("connected");
  });

  test("delete requires --id", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(pagerdutyRun(["delete", "--account-id", "acct-123"], ctx)).rejects.toThrow("--id");
  });

  test("shows help", async () => {
    const { ctx, output } = createTestContext();
    await pagerdutyRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Silences ──────────────────────────────────────────────────────────────

describe("alerts silences", () => {
  test("list returns table", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet([sampleSilence()]),
    });
    await silencesRun(["list", "--account-id", "acct-123"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("create requires --file", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(silencesRun(["create", "--account-id", "acct-123"], ctx)).rejects.toThrow("--file");
  });

  test("delete requires --id", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(silencesRun(["delete", "--account-id", "acct-123"], ctx)).rejects.toThrow("--id");
  });

  test("delete aborts without confirmation", async () => {
    const spy = spyOn(prompts, "confirm").mockResolvedValue(false);
    const { ctx, output } = createTestContext(
      { get: accountGet({}), delete: async () => ({}) },
      { yes: undefined },
    );
    await silencesRun(["delete", "--account-id", "acct-123", "--id", "s-1"], ctx);
    expect(output.captured.warnings[0]).toContain("Aborted");
    spy.mockRestore();
  });

  test("shows help", async () => {
    const { ctx, output } = createTestContext();
    await silencesRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── History ───────────────────────────────────────────────────────────────

describe("alerts history", () => {
  test("returns table of history", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet([sampleHistoryEntry()]),
    });
    await historyRun(["--account-id", "acct-123"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("passes date params", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        if (_path === "/accounts") return [{ id: "acct-123" }];
        capturedParams = params;
        return [];
      },
    });
    await historyRun(["--account-id", "acct-123", "--from", "2024-01-01", "--to", "2024-06-01"], ctx);
    expect(capturedParams!["since"]).toBe("2024-01-01");
    expect(capturedParams!["until"]).toBe("2024-06-01");
  });
});

// ─── Available ─────────────────────────────────────────────────────────────

describe("alerts available", () => {
  test("returns flattened table", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet({
        "Performance": [
          { display_name: "Origin 5xx", type: "real_origin_monitoring", description: "desc" },
        ],
      }),
    });
    await availableRun(["--account-id", "acct-123"], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });
});
