import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Config commands
import { run as configGetRun } from "../../src/commands/mnm/config/get.js";
import { run as configUpdateRun } from "../../src/commands/mnm/config/update.js";

// Rules commands
import { run as rulesListRun } from "../../src/commands/mnm/rules/list.js";
import { run as rulesGetRun } from "../../src/commands/mnm/rules/get.js";
import { run as rulesCreateRun } from "../../src/commands/mnm/rules/create.js";
import { run as rulesUpdateRun } from "../../src/commands/mnm/rules/update.js";
import { run as rulesDeleteRun } from "../../src/commands/mnm/rules/delete.js";

// Routers
import { run as mainRouterRun } from "../../src/commands/mnm/index.js";
import { run as configRouterRun } from "../../src/commands/mnm/config/index.js";
import { run as rulesRouterRun } from "../../src/commands/mnm/rules/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const RULE_ID = "mnm-rule-uuid-123";

function sampleMNMConfig(overrides: Record<string, unknown> = {}) {
  return {
    name: "my-mnm-config",
    default_sampling: 1,
    router_sampling: { router1: 1, router2: 2 },
    ...overrides,
  };
}

function sampleMNMRule(overrides: Record<string, unknown> = {}) {
  return {
    id: RULE_ID,
    name: "my-mnm-rule",
    description: "DDoS detection rule",
    prefixes: ["10.0.0.0/8", "172.16.0.0/12"],
    automatic_advertisement: true,
    duration: "1h",
    bandwidth_threshold: 1000,
    packet_threshold: 10000,
    created_on: "2024-06-01T12:00:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function mnmCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
  const originalGet = clientOverrides.get as ((path: string, params?: Record<string, string>) => Promise<unknown>) | undefined;
  return createTestContext(
    {
      ...clientOverrides,
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID, name: "Test Account" }];
        if (originalGet) return originalGet(path, params);
        return {};
      },
    } as Record<string, unknown>,
    flagOverrides,
  );
}

// ─── MNM Config Get ──────────────────────────────────────────────────────

describe("mnm config get", () => {
  test("gets MNM config", async () => {
    const config = sampleMNMConfig();
    const { ctx, output } = mnmCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return config;
      },
    });

    await configGetRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    const result = output.captured.jsons[0] as Record<string, unknown>;
    expect(result["name"]).toBe("my-mnm-config");
    expect(result["default_sampling"]).toBe(1);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = mnmCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return sampleMNMConfig();
      },
    });

    await configGetRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
    expect(capturedPath).toContain("mnm/config");
  });
});

// ─── MNM Config Update ──────────────────────────────────────────────────

describe("mnm config update", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = mnmCtx();
    expect(configUpdateRun([], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = mnmCtx();
    expect(configUpdateRun([
      "--file", "/tmp/nonexistent-cf-cli-mnm-config.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── MNM Rules List ──────────────────────────────────────────────────────

describe("mnm rules list", () => {
  test("lists MNM rules", async () => {
    const rules = [sampleMNMRule(), sampleMNMRule({ id: "rule-2", name: "other-rule" })];
    const { ctx, output } = mnmCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return rules;
      },
    });

    await rulesListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = mnmCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await rulesListRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
    expect(capturedPath).toContain("mnm/rules");
  });
});

// ─── MNM Rules Get ───────────────────────────────────────────────────────

describe("mnm rules get", () => {
  test("gets an MNM rule by ID", async () => {
    const rule = sampleMNMRule();
    const { ctx, output } = mnmCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return rule;
      },
    });

    await rulesGetRun(["--id", RULE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-mnm-rule");
    expect(output.captured.details[0]!["Description"]).toBe("DDoS detection rule");
    expect(output.captured.details[0]!["Auto Advertisement"]).toBe(true);
  });

  test("throws when --id is missing", async () => {
    const { ctx } = mnmCtx();
    expect(rulesGetRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── MNM Rules Create ───────────────────────────────────────────────────

describe("mnm rules create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = mnmCtx();
    expect(rulesCreateRun([], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = mnmCtx();
    expect(rulesCreateRun([
      "--file", "/tmp/nonexistent-cf-cli-mnm-rule.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── MNM Rules Update ───────────────────────────────────────────────────

describe("mnm rules update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = mnmCtx();
    expect(rulesUpdateRun(["--file", "test.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = mnmCtx();
    expect(rulesUpdateRun(["--id", RULE_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = mnmCtx();
    expect(rulesUpdateRun([
      "--id", RULE_ID,
      "--file", "/tmp/nonexistent-cf-cli-mnm-rule-update.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── MNM Rules Delete ───────────────────────────────────────────────────

describe("mnm rules delete", () => {
  test("deletes an MNM rule with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = mnmCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await rulesDeleteRun(["--id", RULE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(RULE_ID);
    expect(deletedPath).toContain("mnm/rules");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = mnmCtx({}, { yes: undefined });

    await rulesDeleteRun(["--id", RULE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = mnmCtx();
    expect(rulesDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Routers ─────────────────────────────────────────────────────────────

describe("mnm main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown mnm command");
  });

  test("routes config subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["config"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes rules subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["rules"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("mnm config router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await configRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(configRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown mnm config command");
  });
});

describe("mnm rules router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await rulesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(rulesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown mnm rules command");
  });
});
