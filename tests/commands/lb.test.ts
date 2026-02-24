import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// LB command runners
import { run as listRun } from "../../src/commands/lb/list.js";
import { run as getRun } from "../../src/commands/lb/get.js";
import { run as createRun } from "../../src/commands/lb/create.js";
import { run as updateRun } from "../../src/commands/lb/update.js";
import { run as patchRun } from "../../src/commands/lb/patch.js";
import { run as deleteRun } from "../../src/commands/lb/delete.js";
import { run as regionsRun } from "../../src/commands/lb/regions.js";

// Pools
import { run as poolsListRun } from "../../src/commands/lb/pools/list.js";
import { run as poolsGetRun } from "../../src/commands/lb/pools/get.js";
import { run as poolsCreateRun } from "../../src/commands/lb/pools/create.js";
import { run as poolsUpdateRun } from "../../src/commands/lb/pools/update.js";
import { run as poolsDeleteRun } from "../../src/commands/lb/pools/delete.js";
import { run as poolsPreviewRun } from "../../src/commands/lb/pools/preview.js";
import { run as poolsHealthRun } from "../../src/commands/lb/pools/health.js";

// Monitors
import { run as monitorsListRun } from "../../src/commands/lb/monitors/list.js";
import { run as monitorsGetRun } from "../../src/commands/lb/monitors/get.js";
import { run as monitorsCreateRun } from "../../src/commands/lb/monitors/create.js";
import { run as monitorsUpdateRun } from "../../src/commands/lb/monitors/update.js";
import { run as monitorsDeleteRun } from "../../src/commands/lb/monitors/delete.js";
import { run as monitorsPreviewRun } from "../../src/commands/lb/monitors/preview.js";
import { run as monitorsReferencesRun } from "../../src/commands/lb/monitors/references.js";

// Routers
import { run as mainRouterRun } from "../../src/commands/lb/index.js";
import { run as poolsRouterRun } from "../../src/commands/lb/pools/index.js";
import { run as monitorsRouterRun } from "../../src/commands/lb/monitors/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";
const LB_ID = "lb-uuid-123";
const POOL_ID = "pool-uuid-123";
const MONITOR_ID = "monitor-uuid-123";
const ACCOUNT_ID = "abc123def456abc123def456abc12345";

function lbCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

function sampleLB(overrides: Record<string, unknown> = {}) {
  return {
    id: LB_ID,
    name: "lb.example.com",
    enabled: true,
    proxied: true,
    fallback_pool: POOL_ID,
    default_pools: [POOL_ID],
    steering_policy: "random",
    session_affinity: "none",
    created_on: "2024-01-01T00:00:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function samplePool(overrides: Record<string, unknown> = {}) {
  return {
    id: POOL_ID,
    name: "primary-pool",
    enabled: true,
    healthy: true,
    origins: [{ name: "origin-1", address: "1.2.3.4", enabled: true, weight: 1 }],
    monitor: MONITOR_ID,
    check_regions: ["WNAM"],
    created_on: "2024-01-01T00:00:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleMonitor(overrides: Record<string, unknown> = {}) {
  return {
    id: MONITOR_ID,
    type: "http",
    description: "Health check monitor",
    method: "GET",
    path: "/health",
    interval: 60,
    timeout: 5,
    retries: 2,
    expected_codes: "2xx",
    created_on: "2024-01-01T00:00:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

// ─── LB Router ──────────────────────────────────────────────────────────

describe("lb main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown lb command");
  });

  test("routes 'pools' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["pools"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'monitors' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["monitors"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── LB List ────────────────────────────────────────────────────────────

describe("lb list", () => {
  test("lists load balancers", async () => {
    const lbs = [sampleLB(), sampleLB({ id: "lb-2", name: "lb2.example.com" })];
    const { ctx, output } = createTestContext({
      get: async () => lbs,
    });

    await listRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(listRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── LB Get ─────────────────────────────────────────────────────────────

describe("lb get", () => {
  test("gets a load balancer by ID", async () => {
    const lb = sampleLB();
    const { ctx, output } = createTestContext({
      get: async () => lb,
    });

    await getRun(["--zone", ZONE_ID, "--id", LB_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("lb.example.com");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(getRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(getRun(["--id", LB_ID], ctx)).rejects.toThrow("--zone");
  });
});

// ─── LB Create ──────────────────────────────────────────────────────────

describe("lb create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(createRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(createRun(["--file", "lb.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = createTestContext();
    expect(createRun(["--zone", ZONE_ID, "--file", "/tmp/nonexistent-cf-cli-lb.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── LB Update ──────────────────────────────────────────────────────────

describe("lb update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--zone", ZONE_ID, "--file", "lb.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--zone", ZONE_ID, "--id", LB_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--zone", ZONE_ID, "--id", LB_ID, "--file", "/tmp/nonexistent-cf-cli-lb.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── LB Patch ───────────────────────────────────────────────────────────

describe("lb patch", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(patchRun(["--zone", ZONE_ID, "--file", "lb.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(patchRun(["--zone", ZONE_ID, "--id", LB_ID], ctx)).rejects.toThrow("--file");
  });
});

// ─── LB Delete ──────────────────────────────────────────────────────────

describe("lb delete", () => {
  test("deletes a load balancer with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await deleteRun(["--zone", ZONE_ID, "--id", LB_ID], ctx);

    expect(deletedPath).toContain(LB_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await deleteRun(["--zone", ZONE_ID, "--id", LB_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(deleteRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── LB Regions ─────────────────────────────────────────────────────────

describe("lb regions", () => {
  test("lists regions", async () => {
    const regions = {
      WNAM: { region_code: "WNAM", countries: ["US", "CA"] },
      ENAM: { region_code: "ENAM", countries: ["US"] },
    };
    const { ctx, output } = createTestContext({
      get: async () => regions,
    });

    await regionsRun([], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

// ─── LB Pools ───────────────────────────────────────────────────────────

describe("lb pools router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await poolsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown action", async () => {
    const { ctx } = createTestContext();
    expect(poolsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown lb pools action");
  });
});

describe("lb pools list", () => {
  test("lists pools", async () => {
    const pools = [samplePool(), samplePool({ id: "pool-2", name: "secondary-pool" })];
    const { ctx, output } = lbCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return pools;
      },
    });

    await poolsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("lb pools get", () => {
  test("gets a pool by ID", async () => {
    const pool = samplePool();
    const { ctx, output } = createTestContext({
      get: async () => pool,
    });

    await poolsGetRun(["--id", POOL_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("primary-pool");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(poolsGetRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("lb pools create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(poolsCreateRun([], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = createTestContext();
    expect(poolsCreateRun(["--file", "/tmp/nonexistent-cf-cli-pool.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

describe("lb pools update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(poolsUpdateRun(["--file", "pool.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(poolsUpdateRun(["--id", POOL_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("lb pools delete", () => {
  test("deletes a pool with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await poolsDeleteRun(["--id", POOL_ID], ctx);

    expect(deletedPath).toContain(POOL_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await poolsDeleteRun(["--id", POOL_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(poolsDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("lb pools preview", () => {
  test("previews pool status", async () => {
    const preview = { preview_id: "p-1", pools: {} };
    const { ctx, output } = createTestContext({
      get: async () => preview,
    });

    await poolsPreviewRun(["--id", POOL_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(poolsPreviewRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("lb pools health", () => {
  test("gets pool health", async () => {
    const health = { pool_id: POOL_ID, pop_health: {} };
    const { ctx, output } = createTestContext({
      get: async () => health,
    });

    await poolsHealthRun(["--id", POOL_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(poolsHealthRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── LB Monitors ─────────────────────────────────────────────────────────

describe("lb monitors router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await monitorsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown action", async () => {
    const { ctx } = createTestContext();
    expect(monitorsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown lb monitors action");
  });
});

describe("lb monitors list", () => {
  test("lists monitors", async () => {
    const monitors = [sampleMonitor(), sampleMonitor({ id: "mon-2", description: "TCP monitor" })];
    const { ctx, output } = lbCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return monitors;
      },
    });

    await monitorsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("lb monitors get", () => {
  test("gets a monitor by ID", async () => {
    const monitor = sampleMonitor();
    const { ctx, output } = createTestContext({
      get: async () => monitor,
    });

    await monitorsGetRun(["--id", MONITOR_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Type"]).toBe("http");
    expect(output.captured.details[0]!["Path"]).toBe("/health");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(monitorsGetRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("lb monitors create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(monitorsCreateRun([], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = createTestContext();
    expect(monitorsCreateRun(["--file", "/tmp/nonexistent-cf-cli-monitor.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

describe("lb monitors update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(monitorsUpdateRun(["--file", "monitor.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(monitorsUpdateRun(["--id", MONITOR_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("lb monitors delete", () => {
  test("deletes a monitor with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await monitorsDeleteRun(["--id", MONITOR_ID], ctx);

    expect(deletedPath).toContain(MONITOR_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await monitorsDeleteRun(["--id", MONITOR_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(monitorsDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("lb monitors preview", () => {
  test("previews monitor", async () => {
    const preview = { preview_id: "p-1" };
    const { ctx, output } = createTestContext({
      get: async () => preview,
    });

    await monitorsPreviewRun(["--id", MONITOR_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(monitorsPreviewRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("lb monitors references", () => {
  test("lists monitor references", async () => {
    const refs = [{ pool_id: POOL_ID, pool_name: "primary-pool" }];
    const { ctx, output } = createTestContext({
      get: async () => refs,
    });

    await monitorsReferencesRun(["--id", MONITOR_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(monitorsReferencesRun([], ctx)).rejects.toThrow("--id");
  });
});
