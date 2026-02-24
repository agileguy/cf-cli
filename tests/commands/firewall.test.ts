import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// IP Rules
import { run as ipListRun } from "../../src/commands/firewall/ip-rules/list.js";
import { run as ipCreateRun } from "../../src/commands/firewall/ip-rules/create.js";
import { run as ipUpdateRun } from "../../src/commands/firewall/ip-rules/update.js";
import { run as ipDeleteRun } from "../../src/commands/firewall/ip-rules/delete.js";
import { run as ipRouterRun } from "../../src/commands/firewall/ip-rules/index.js";

// UA Rules
import { run as uaListRun } from "../../src/commands/firewall/ua-rules/list.js";
import { run as uaCreateRun } from "../../src/commands/firewall/ua-rules/create.js";
import { run as uaDeleteRun } from "../../src/commands/firewall/ua-rules/delete.js";
import { run as uaRouterRun } from "../../src/commands/firewall/ua-rules/index.js";

// Zone Lockdowns
import { run as ldListRun } from "../../src/commands/firewall/zone-lockdowns/list.js";
import { run as ldCreateRun } from "../../src/commands/firewall/zone-lockdowns/create.js";
import { run as ldDeleteRun } from "../../src/commands/firewall/zone-lockdowns/delete.js";
import { run as ldRouterRun } from "../../src/commands/firewall/zone-lockdowns/index.js";

// Main Router
import { run as fwRouterRun } from "../../src/commands/firewall/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";

function sampleIPRule(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "ip-rule-123",
    mode: "block",
    notes: "Block bad actor",
    configuration: { target: "ip", value: "1.2.3.4" },
    scope: { id: ZONE_ID, type: "zone" },
    created_on: "2024-06-01T12:00:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleUARule(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "ua-rule-456",
    description: "Block bad bot",
    mode: "block",
    paused: false,
    configuration: { target: "ua", value: "BadBot/1.0" },
    ...overrides,
  };
}

function sampleLockdown(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "lockdown-789",
    description: "Admin lockdown",
    paused: false,
    urls: ["api.example.com/admin/*"],
    configurations: [
      { target: "ip", value: "10.0.0.1" },
      { target: "ip_range", value: "192.168.0.0/24" },
    ],
    created_on: "2024-06-01T12:00:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

// ─── IP Rules ──────────────────────────────────────────────────────────

describe("firewall ip-rules list", () => {
  test("lists IP access rules", async () => {
    const rules = [sampleIPRule(), sampleIPRule({ id: "ip-2", configuration: { target: "ip", value: "5.6.7.8" } })];
    const { ctx, output } = createTestContext({
      get: async () => rules,
    });

    await ipListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(ipListRun([], ctx)).rejects.toThrow("--zone");
  });
});

describe("firewall ip-rules create", () => {
  test("creates an IP access rule", async () => {
    let capturedBody: unknown;
    const { ctx, output } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleIPRule();
      },
    });

    await ipCreateRun(["--zone", ZONE_ID, "--ip", "1.2.3.4", "--mode", "block"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    const body = capturedBody as Record<string, unknown>;
    expect(body["mode"]).toBe("block");
    const config = body["configuration"] as { target: string; value: string };
    expect(config.target).toBe("ip");
    expect(config.value).toBe("1.2.3.4");
  });

  test("detects IP ranges", async () => {
    let capturedBody: unknown;
    const { ctx } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleIPRule();
      },
    });

    await ipCreateRun(["--zone", ZONE_ID, "--ip", "10.0.0.0/24", "--mode", "block"], ctx);

    const body = capturedBody as Record<string, unknown>;
    const config = body["configuration"] as { target: string; value: string };
    expect(config.target).toBe("ip_range");
  });

  test("throws on invalid mode", async () => {
    const { ctx } = createTestContext();
    expect(ipCreateRun(["--zone", ZONE_ID, "--ip", "1.2.3.4", "--mode", "invalid"], ctx)).rejects.toThrow("Invalid mode");
  });

  test("throws when --ip missing", async () => {
    const { ctx } = createTestContext();
    expect(ipCreateRun(["--zone", ZONE_ID, "--mode", "block"], ctx)).rejects.toThrow("--ip");
  });

  test("throws when --mode missing", async () => {
    const { ctx } = createTestContext();
    expect(ipCreateRun(["--zone", ZONE_ID, "--ip", "1.2.3.4"], ctx)).rejects.toThrow("--mode");
  });
});

describe("firewall ip-rules update", () => {
  test("updates an IP access rule", async () => {
    let capturedPath = "";
    let capturedBody: unknown;
    const { ctx, output } = createTestContext({
      patch: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return sampleIPRule({ mode: "whitelist" });
      },
    });

    await ipUpdateRun(["--zone", ZONE_ID, "--id", "ip-rule-123", "--mode", "whitelist"], ctx);

    expect(capturedPath).toContain("ip-rule-123");
    expect(output.captured.successes).toHaveLength(1);
    expect((capturedBody as Record<string, unknown>)["mode"]).toBe("whitelist");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(ipUpdateRun(["--zone", ZONE_ID, "--mode", "block"], ctx)).rejects.toThrow("--id");
  });
});

describe("firewall ip-rules delete", () => {
  test("deletes an IP access rule with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return { id: "ip-rule-123" };
      },
    });

    await ipDeleteRun(["--zone", ZONE_ID, "--id", "ip-rule-123"], ctx);

    expect(deletedPath).toContain("ip-rule-123");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await ipDeleteRun(["--zone", ZONE_ID, "--id", "ip-rule-123"], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

// ─── UA Rules ──────────────────────────────────────────────────────────

describe("firewall ua-rules list", () => {
  test("lists UA rules", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [sampleUARule()],
    });

    await uaListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(uaListRun([], ctx)).rejects.toThrow("--zone");
  });
});

describe("firewall ua-rules create", () => {
  test("creates a UA rule", async () => {
    let capturedBody: unknown;
    const { ctx, output } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleUARule();
      },
    });

    await uaCreateRun(["--zone", ZONE_ID, "--ua", "BadBot/1.0", "--mode", "block"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    const body = capturedBody as Record<string, unknown>;
    expect(body["mode"]).toBe("block");
    const config = body["configuration"] as { target: string; value: string };
    expect(config.target).toBe("ua");
    expect(config.value).toBe("BadBot/1.0");
  });

  test("throws on invalid mode", async () => {
    const { ctx } = createTestContext();
    expect(uaCreateRun(["--zone", ZONE_ID, "--ua", "Bot", "--mode", "invalid"], ctx)).rejects.toThrow("Invalid mode");
  });

  test("throws when --ua missing", async () => {
    const { ctx } = createTestContext();
    expect(uaCreateRun(["--zone", ZONE_ID, "--mode", "block"], ctx)).rejects.toThrow("--ua");
  });
});

describe("firewall ua-rules delete", () => {
  test("deletes a UA rule with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return { id: "ua-rule-456" };
      },
    });

    await uaDeleteRun(["--zone", ZONE_ID, "--id", "ua-rule-456"], ctx);

    expect(deletedPath).toContain("ua-rule-456");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await uaDeleteRun(["--zone", ZONE_ID, "--id", "ua-rule-456"], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

// ─── Zone Lockdowns ────────────────────────────────────────────────────

describe("firewall zone-lockdowns list", () => {
  test("lists zone lockdowns", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [sampleLockdown()],
    });

    await ldListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(ldListRun([], ctx)).rejects.toThrow("--zone");
  });
});

describe("firewall zone-lockdowns create", () => {
  test("creates a zone lockdown", async () => {
    let capturedBody: unknown;
    const { ctx, output } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleLockdown();
      },
    });

    await ldCreateRun(["--zone", ZONE_ID, "--url", "api.example.com/admin/*", "--ips", "10.0.0.1,192.168.0.0/24"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    const body = capturedBody as Record<string, unknown>;
    expect((body["urls"] as string[])[0]).toBe("api.example.com/admin/*");
    const configs = body["configurations"] as { target: string; value: string }[];
    expect(configs).toHaveLength(2);
    expect(configs[0]!.target).toBe("ip");
    expect(configs[1]!.target).toBe("ip_range");
  });

  test("throws when --url missing", async () => {
    const { ctx } = createTestContext();
    expect(ldCreateRun(["--zone", ZONE_ID, "--ips", "1.2.3.4"], ctx)).rejects.toThrow("--url");
  });

  test("throws when --ips missing", async () => {
    const { ctx } = createTestContext();
    expect(ldCreateRun(["--zone", ZONE_ID, "--url", "example.com/*"], ctx)).rejects.toThrow("--ips");
  });
});

describe("firewall zone-lockdowns delete", () => {
  test("deletes a lockdown with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return { id: "lockdown-789" };
      },
    });

    await ldDeleteRun(["--zone", ZONE_ID, "--id", "lockdown-789"], ctx);

    expect(deletedPath).toContain("lockdown-789");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await ldDeleteRun(["--zone", ZONE_ID, "--id", "lockdown-789"], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

// ─── Router tests ──────────────────────────────────────────────────────

describe("firewall router", () => {
  test("routes to ip-rules", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await fwRouterRun(["ip-rules", "list", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes to ua-rules", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await fwRouterRun(["ua-rules", "list", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes to zone-lockdowns", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await fwRouterRun(["zone-lockdowns", "list", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes with aliases", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await fwRouterRun(["lockdowns", "list", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await fwRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(fwRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown firewall command");
  });
});

describe("firewall ip-rules router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await ipRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(ipRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown firewall ip-rules command");
  });
});

describe("firewall ua-rules router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await uaRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(uaRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown firewall ua-rules command");
  });
});

describe("firewall zone-lockdowns router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await ldRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(ldRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown firewall zone-lockdowns command");
  });
});
