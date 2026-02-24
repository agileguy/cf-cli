import { describe, test, expect, spyOn } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as routerRun } from "../../src/commands/email-routing/index.js";
import { run as settingsRouterRun } from "../../src/commands/email-routing/settings/index.js";
import { run as settingsGetRun } from "../../src/commands/email-routing/settings/get.js";
import { run as settingsEnableRun } from "../../src/commands/email-routing/settings/enable.js";
import { run as settingsDisableRun } from "../../src/commands/email-routing/settings/disable.js";
import { run as dnsRun } from "../../src/commands/email-routing/dns.js";
import { run as addressesRouterRun } from "../../src/commands/email-routing/addresses/index.js";
import { run as addressesListRun } from "../../src/commands/email-routing/addresses/list.js";
import { run as addressesCreateRun } from "../../src/commands/email-routing/addresses/create.js";
import { run as addressesGetRun } from "../../src/commands/email-routing/addresses/get.js";
import { run as addressesDeleteRun } from "../../src/commands/email-routing/addresses/delete.js";
import { run as rulesRouterRun } from "../../src/commands/email-routing/rules/index.js";
import { run as rulesListRun } from "../../src/commands/email-routing/rules/list.js";
import { run as rulesGetRun } from "../../src/commands/email-routing/rules/get.js";
import { run as rulesDeleteRun } from "../../src/commands/email-routing/rules/delete.js";
import { run as catchAllRun } from "../../src/commands/email-routing/rules/catch-all.js";

const prompts = await import("../../src/utils/prompts.js");

const sampleSettings = () => ({
  tag: "tag-abc",
  name: "example.com",
  enabled: true,
  created: "2024-01-01T00:00:00.000Z",
  modified: "2024-06-01T00:00:00.000Z",
  skip_wizard: false,
  status: "ready",
});

const sampleDnsRecords = () => [
  { type: "MX", name: "example.com", content: "route1.mx.cloudflare.net", ttl: 3600, priority: 40 },
  { type: "TXT", name: "example.com", content: "v=spf1 include:_spf.mx.cloudflare.net ~all", ttl: 3600 },
];

const sampleAddress = () => ({
  tag: "addr-tag-1",
  email: "user@example.com",
  verified: "2024-01-01T00:00:00.000Z",
  created: "2024-01-01T00:00:00.000Z",
  modified: "2024-06-01T00:00:00.000Z",
});

const sampleRule = () => ({
  tag: "rule-tag-1",
  name: "Forward emails",
  enabled: true,
  priority: 0,
  matchers: [{ type: "literal", field: "to", value: "info@example.com" }],
  actions: [{ type: "forward", value: ["dest@example.com"] }],
});

const sampleCatchAll = () => ({
  tag: "catchall-tag",
  name: "Catch-all",
  enabled: true,
  matchers: [{ type: "all" }],
  actions: [{ type: "drop" }],
});

// Helper: zone lookup mock
const zoneGet = (returnVal: unknown) => async (path: string) => {
  if (path === "/zones") return [{ id: "zone-id-123", name: "example.com" }];
  return returnVal;
};

// Helper: account lookup mock
const accountGet = (returnVal: unknown) => async (path: string) => {
  if (path === "/accounts") return [{ id: "acct-123", name: "Test" }];
  return returnVal;
};

// ─── Router ────────────────────────────────────────────────────────────────

describe("email-routing router", () => {
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

// ─── Settings ──────────────────────────────────────────────────────────────

describe("email-routing settings", () => {
  test("settings router shows help", async () => {
    const { ctx, output } = createTestContext();
    await settingsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("settings get returns details", async () => {
    const { ctx, output } = createTestContext({ get: zoneGet(sampleSettings()) });
    await settingsGetRun(["--zone", "example.com"], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Enabled"]).toBe(true);
  });

  test("settings get requires --zone", async () => {
    const { ctx } = createTestContext();
    expect(settingsGetRun([], ctx)).rejects.toThrow("--zone");
  });

  test("settings enable returns success", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [{ id: "zone-id-123", name: "example.com" }],
      post: async () => sampleSettings(),
    });
    await settingsEnableRun(["--zone", "example.com"], ctx);
    expect(output.captured.successes[0]).toContain("enabled");
  });

  test("settings disable requires confirmation", async () => {
    const spy = spyOn(prompts, "confirm").mockResolvedValue(false);
    const { ctx, output } = createTestContext(
      { get: async () => [{ id: "zone-id-123" }], post: async () => sampleSettings() },
      { yes: undefined },
    );
    await settingsDisableRun(["--zone", "example.com"], ctx);
    expect(output.captured.warnings[0]).toContain("Aborted");
    spy.mockRestore();
  });

  test("settings disable proceeds when confirmed", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [{ id: "zone-id-123" }],
      post: async () => sampleSettings(),
    });
    await settingsDisableRun(["--zone", "example.com"], ctx);
    expect(output.captured.successes[0]).toContain("disabled");
  });
});

// ─── DNS ────────────────────────────────────────────────────────────────────

describe("email-routing dns", () => {
  test("dns returns table of records", async () => {
    const { ctx, output } = createTestContext({ get: zoneGet(sampleDnsRecords()) });
    await dnsRun(["--zone", "example.com"], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("dns requires --zone", async () => {
    const { ctx } = createTestContext();
    expect(dnsRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Addresses ─────────────────────────────────────────────────────────────

describe("email-routing addresses", () => {
  test("addresses router shows help", async () => {
    const { ctx, output } = createTestContext();
    await addressesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("addresses list returns table", async () => {
    const { ctx, output } = createTestContext({ get: accountGet([sampleAddress()]) });
    await addressesListRun(["--account-id", "acct-123"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("addresses create requires --email", async () => {
    const { ctx } = createTestContext({ get: accountGet([]) });
    expect(addressesCreateRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--email");
  });

  test("addresses create returns success", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [{ id: "acct-123" }],
      post: async () => sampleAddress(),
    });
    await addressesCreateRun(["--account-id", "acct-123", "--email", "user@example.com"], ctx);
    expect(output.captured.successes[0]).toContain("created");
  });

  test("addresses get requires --id", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(addressesGetRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--id");
  });

  test("addresses delete requires --id", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(addressesDeleteRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--id");
  });

  test("addresses delete aborts without confirmation", async () => {
    const spy = spyOn(prompts, "confirm").mockResolvedValue(false);
    const { ctx, output } = createTestContext(
      { get: accountGet({}), delete: async () => ({}) },
      { yes: undefined },
    );
    await addressesDeleteRun(["--account-id", "acct-123", "--id", "addr-1"], ctx);
    expect(output.captured.warnings[0]).toContain("Aborted");
    spy.mockRestore();
  });

  test("addresses delete succeeds", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet({}),
      delete: async () => ({}),
    });
    await addressesDeleteRun(["--account-id", "acct-123", "--id", "addr-1"], ctx);
    expect(output.captured.successes[0]).toContain("deleted");
  });
});

// ─── Rules ─────────────────────────────────────────────────────────────────

describe("email-routing rules", () => {
  test("rules router shows help", async () => {
    const { ctx, output } = createTestContext();
    await rulesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("rules list returns table", async () => {
    const { ctx, output } = createTestContext({ get: zoneGet([sampleRule()]) });
    await rulesListRun(["--zone", "example.com"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("rules get requires --zone and --id", async () => {
    const { ctx } = createTestContext();
    expect(rulesGetRun([], ctx)).rejects.toThrow("--zone");
    const { ctx: ctx2 } = createTestContext({ get: zoneGet({}) });
    expect(rulesGetRun(["--zone", "example.com"], ctx2)).rejects.toThrow("--id");
  });

  test("rules get returns details", async () => {
    const { ctx, output } = createTestContext({ get: zoneGet(sampleRule()) });
    await rulesGetRun(["--zone", "example.com", "--id", "rule-1"], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Tag"]).toBe("rule-tag-1");
  });

  test("rules delete aborts without confirmation", async () => {
    const spy = spyOn(prompts, "confirm").mockResolvedValue(false);
    const { ctx, output } = createTestContext(
      { get: zoneGet({}), delete: async () => ({}) },
      { yes: undefined },
    );
    await rulesDeleteRun(["--zone", "example.com", "--id", "rule-1"], ctx);
    expect(output.captured.warnings[0]).toContain("Aborted");
    spy.mockRestore();
  });

  test("rules delete succeeds", async () => {
    const { ctx, output } = createTestContext({
      get: zoneGet({}),
      delete: async () => ({}),
    });
    await rulesDeleteRun(["--zone", "example.com", "--id", "rule-1"], ctx);
    expect(output.captured.successes[0]).toContain("deleted");
  });
});

// ─── Catch-All ─────────────────────────────────────────────────────────────

describe("email-routing catch-all", () => {
  test("catch-all shows help", async () => {
    const { ctx, output } = createTestContext();
    await catchAllRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("catch-all get returns details", async () => {
    const { ctx, output } = createTestContext({ get: zoneGet(sampleCatchAll()) });
    await catchAllRun(["get", "--zone", "example.com"], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Enabled"]).toBe(true);
  });

  test("catch-all get requires --zone", async () => {
    const { ctx } = createTestContext();
    expect(catchAllRun(["get"], ctx)).rejects.toThrow("--zone");
  });

  test("catch-all update requires --zone and --file", async () => {
    const { ctx } = createTestContext();
    expect(catchAllRun(["update"], ctx)).rejects.toThrow("--zone");
    const { ctx: ctx2 } = createTestContext({ get: zoneGet({}) });
    expect(catchAllRun(["update", "--zone", "example.com"], ctx2)).rejects.toThrow("--file");
  });
});
