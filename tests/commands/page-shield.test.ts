import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Settings
import { run as settingsGetRun } from "../../src/commands/page-shield/settings/get.js";
import { run as settingsUpdateRun } from "../../src/commands/page-shield/settings/update.js";
import { run as settingsRouterRun } from "../../src/commands/page-shield/settings/index.js";

// Scripts
import { run as scriptsListRun } from "../../src/commands/page-shield/scripts/list.js";
import { run as scriptsGetRun } from "../../src/commands/page-shield/scripts/get.js";
import { run as scriptsRouterRun } from "../../src/commands/page-shield/scripts/index.js";

// Connections
import { run as connectionsListRun } from "../../src/commands/page-shield/connections/list.js";
import { run as connectionsGetRun } from "../../src/commands/page-shield/connections/get.js";
import { run as connectionsRouterRun } from "../../src/commands/page-shield/connections/index.js";

// Policies
import { run as policiesListRun } from "../../src/commands/page-shield/policies/list.js";
import { run as policiesCreateRun } from "../../src/commands/page-shield/policies/create.js";
import { run as policiesUpdateRun } from "../../src/commands/page-shield/policies/update.js";
import { run as policiesDeleteRun } from "../../src/commands/page-shield/policies/delete.js";
import { run as policiesRouterRun } from "../../src/commands/page-shield/policies/index.js";

// Main Router
import { run as psRouterRun } from "../../src/commands/page-shield/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";

function sampleSettings(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    enabled: true,
    updated_at: "2024-06-01T12:00:00.000Z",
    use_cloudflare_reporting_endpoint: true,
    use_connection_url_path: false,
    ...overrides,
  };
}

function sampleScript(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "script-uuid-123",
    url: "https://cdn.example.com/widget.js",
    added_at: "2024-06-01T12:00:00.000Z",
    first_seen_at: "2024-06-01T12:00:00.000Z",
    last_seen_at: "2024-06-15T08:00:00.000Z",
    host: "cdn.example.com",
    domain_reported_malicious: false,
    hash: "sha256-abc123",
    js_integrity_score: 85,
    page_urls: ["https://example.com/"],
    ...overrides,
  };
}

function sampleConnection(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "conn-uuid-456",
    url: "wss://analytics.example.com/ws",
    added_at: "2024-06-01T12:00:00.000Z",
    first_seen_at: "2024-06-01T12:00:00.000Z",
    last_seen_at: "2024-06-15T08:00:00.000Z",
    host: "analytics.example.com",
    domain_reported_malicious: false,
    page_urls: ["https://example.com/dashboard"],
    ...overrides,
  };
}

function samplePolicy(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "policy-uuid-789",
    value: "script-src 'self'",
    action: "allow",
    description: "Default CSP",
    enabled: true,
    expression: "true",
    created_at: "2024-06-01T12:00:00.000Z",
    updated_at: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

// ─── Settings ──────────────────────────────────────────────────────────

describe("page-shield settings get", () => {
  test("gets settings", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleSettings(),
    });

    await settingsGetRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Enabled"]).toBe(true);
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(settingsGetRun([], ctx)).rejects.toThrow("--zone");
  });
});

describe("page-shield settings update", () => {
  test("updates settings with --enabled", async () => {
    let capturedBody: unknown;
    const { ctx, output } = createTestContext({
      put: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleSettings({ enabled: true });
      },
    });

    await settingsUpdateRun(["--zone", ZONE_ID, "--enabled"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    const body = capturedBody as Record<string, unknown>;
    expect(body["enabled"]).toBe(true);
  });

  test("updates settings with --no-enabled", async () => {
    let capturedBody: unknown;
    const { ctx } = createTestContext({
      put: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleSettings({ enabled: false });
      },
    });

    await settingsUpdateRun(["--zone", ZONE_ID, "--no-enabled"], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["enabled"]).toBe(false);
  });

  test("throws when no setting flags provided", async () => {
    const { ctx } = createTestContext();
    expect(settingsUpdateRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("At least one setting");
  });
});

// ─── Scripts ───────────────────────────────────────────────────────────

describe("page-shield scripts list", () => {
  test("lists scripts", async () => {
    const scripts = [sampleScript(), sampleScript({ id: "script-2", url: "https://other.com/script.js" })];
    const { ctx, output } = createTestContext({
      get: async () => scripts,
    });

    await scriptsListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(scriptsListRun([], ctx)).rejects.toThrow("--zone");
  });
});

describe("page-shield scripts get", () => {
  test("gets script details", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleScript(),
    });

    await scriptsGetRun(["--zone", ZONE_ID, "--id", "script-uuid-123"], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["URL"]).toBe("https://cdn.example.com/widget.js");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(scriptsGetRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Connections ───────────────────────────────────────────────────────

describe("page-shield connections list", () => {
  test("lists connections", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [sampleConnection()],
    });

    await connectionsListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(connectionsListRun([], ctx)).rejects.toThrow("--zone");
  });
});

describe("page-shield connections get", () => {
  test("gets connection details", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleConnection(),
    });

    await connectionsGetRun(["--zone", ZONE_ID, "--id", "conn-uuid-456"], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["URL"]).toBe("wss://analytics.example.com/ws");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(connectionsGetRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Policies ──────────────────────────────────────────────────────────

describe("page-shield policies list", () => {
  test("lists policies", async () => {
    const policies = [samplePolicy(), samplePolicy({ id: "policy-2" })];
    const { ctx, output } = createTestContext({
      get: async () => policies,
    });

    await policiesListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(policiesListRun([], ctx)).rejects.toThrow("--zone");
  });
});

describe("page-shield policies create", () => {
  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(policiesCreateRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("page-shield policies update", () => {
  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(policiesUpdateRun(["--zone", ZONE_ID, "--file", "x.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(policiesUpdateRun(["--zone", ZONE_ID, "--id", "policy-1"], ctx)).rejects.toThrow("--file");
  });
});

describe("page-shield policies delete", () => {
  test("deletes a policy with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return { id: "policy-uuid-789" };
      },
    });

    await policiesDeleteRun(["--zone", ZONE_ID, "--id", "policy-uuid-789"], ctx);

    expect(deletedPath).toContain("policy-uuid-789");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await policiesDeleteRun(["--zone", ZONE_ID, "--id", "policy-uuid-789"], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

// ─── Router tests ──────────────────────────────────────────────────────

describe("page-shield router", () => {
  test("routes to settings", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleSettings(),
    });
    await psRouterRun(["settings", "get", "--zone", ZONE_ID], ctx);
    expect(output.captured.details).toHaveLength(1);
  });

  test("routes to scripts", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await psRouterRun(["scripts", "list", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes to connections", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await psRouterRun(["connections", "list", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes to policies", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await psRouterRun(["policies", "list", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await psRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(psRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown page-shield command");
  });
});

describe("page-shield settings router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await settingsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(settingsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown page-shield settings command");
  });
});

describe("page-shield scripts router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await scriptsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(scriptsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown page-shield scripts command");
  });
});

describe("page-shield connections router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await connectionsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(connectionsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown page-shield connections command");
  });
});

describe("page-shield policies router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await policiesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(policiesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown page-shield policies command");
  });
});
