import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as routerRun } from "../../src/commands/registrar/index.js";
import { run as listRun } from "../../src/commands/registrar/list.js";
import { run as getRun } from "../../src/commands/registrar/get.js";
import { run as updateRun } from "../../src/commands/registrar/update.js";
import { run as transferInRun } from "../../src/commands/registrar/transfer-in.js";

const sampleDomain = () => ({
  id: "reg-uuid-123",
  name: "example.com",
  status: "active",
  current_registrar: "Cloudflare",
  locked: true,
  auto_renew: true,
  privacy: true,
  name_servers: ["ns1.cloudflare.com", "ns2.cloudflare.com"],
  expires_at: "2025-01-01T00:00:00.000Z",
  created_at: "2023-01-01T00:00:00.000Z",
  updated_at: "2024-06-01T00:00:00.000Z",
});

// Helper: account lookup mock
const accountGet = (returnVal: unknown) => async (path: string) => {
  if (path === "/accounts") return [{ id: "acct-123", name: "Test" }];
  return returnVal;
};

// ─── Router ────────────────────────────────────────────────────────────────

describe("registrar router", () => {
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

// ─── List ──────────────────────────────────────────────────────────────────

describe("registrar list", () => {
  test("returns table of domains", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet([sampleDomain()]),
    });
    await listRun(["--account-id", "acct-123"], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });
});

// ─── Get ───────────────────────────────────────────────────────────────────

describe("registrar get", () => {
  test("requires --domain", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(getRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--domain");
  });

  test("returns details", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet(sampleDomain()),
    });
    await getRun(["--account-id", "acct-123", "--domain", "example.com"], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("example.com");
    expect(output.captured.details[0]!["Auto-Renew"]).toBe(true);
    expect(output.captured.details[0]!["Locked"]).toBe(true);
  });
});

// ─── Update ────────────────────────────────────────────────────────────────

describe("registrar update", () => {
  test("requires --domain", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(updateRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--domain");
  });

  test("updates domain settings", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [{ id: "acct-123" }],
      put: async () => sampleDomain(),
    });
    await updateRun(["--account-id", "acct-123", "--domain", "example.com", "--auto-renew", "--locked"], ctx);
    expect(output.captured.successes[0]).toContain("updated");
    expect(output.captured.details[0]!["Auto-Renew"]).toBe(true);
  });
});

// ─── Transfer In ───────────────────────────────────────────────────────────

describe("registrar transfer-in", () => {
  test("requires --domain", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(transferInRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--domain");
  });

  test("initiates transfer", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [{ id: "acct-123" }],
      post: async () => sampleDomain(),
    });
    await transferInRun(["--account-id", "acct-123", "--domain", "example.com"], ctx);
    expect(output.captured.successes[0]).toContain("Transfer initiated");
  });
});
