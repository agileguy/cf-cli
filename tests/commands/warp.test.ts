import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Settings commands
import { run as settingsGetRun } from "../../src/commands/warp/settings/get.js";
import { run as settingsUpdateRun } from "../../src/commands/warp/settings/update.js";

// Split-tunnels commands
import { run as splitListRun } from "../../src/commands/warp/split-tunnels/list.js";
import { run as splitAddRun } from "../../src/commands/warp/split-tunnels/add.js";
import { run as splitRemoveRun } from "../../src/commands/warp/split-tunnels/remove.js";

// Fleet status
import { run as fleetStatusRun } from "../../src/commands/warp/fleet-status.js";

// Routers
import { run as mainRouterRun } from "../../src/commands/warp/index.js";
import { run as settingsRouterRun } from "../../src/commands/warp/settings/index.js";
import { run as splitRouterRun } from "../../src/commands/warp/split-tunnels/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";

function sampleSettings(overrides: Record<string, unknown> = {}) {
  return {
    disable_auto_fallback: false,
    captive_portal: 180,
    allowed_to_leave: true,
    switch_locked: false,
    auto_connect: 0,
    service_mode_v2: { mode: "warp", port: 0 },
    ...overrides,
  };
}

function sampleSplitEntry(overrides: Record<string, unknown> = {}) {
  return {
    address: "10.0.0.0/8",
    description: "Internal network",
    ...overrides,
  };
}

function sampleFleetDevice(overrides: Record<string, unknown> = {}) {
  return {
    device_id: "fleet-dev-123",
    device_name: "Dan's Laptop",
    status: "connected",
    platform: "macOS",
    version: "2024.6.0",
    colo: "DFW",
    last_seen: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function warpCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── WARP Settings Get ──────────────────────────────────────────────────

describe("warp settings get", () => {
  test("gets WARP settings", async () => {
    const settings = sampleSettings();
    const { ctx, output } = warpCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return settings;
      },
    });

    await settingsGetRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    const result = output.captured.jsons[0] as Record<string, unknown>;
    expect(result["captive_portal"]).toBe(180);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = warpCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return {};
      },
    });

    await settingsGetRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
    expect(capturedPath).toContain("devices/settings");
  });
});

// ─── WARP Settings Update ───────────────────────────────────────────────

describe("warp settings update", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = warpCtx();
    expect(settingsUpdateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = warpCtx();
    expect(settingsUpdateRun([
      "--file", "/tmp/nonexistent-cf-cli-warp-settings.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── WARP Split Tunnels List ────────────────────────────────────────────

describe("warp split-tunnels list", () => {
  test("lists split tunnel entries", async () => {
    const entries = [sampleSplitEntry(), sampleSplitEntry({ address: "192.168.0.0/16" })];
    const { ctx, output } = warpCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return entries;
      },
    });

    await splitListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = warpCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await splitListRun([], ctx);

    expect(capturedPath).toContain("policy/exclude");
  });
});

// ─── WARP Split Tunnels Add ─────────────────────────────────────────────

describe("warp split-tunnels add", () => {
  test("adds a split tunnel entry", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const existing = [sampleSplitEntry()];
    const { ctx, output } = warpCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return existing;
      },
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return body;
      },
    });

    await splitAddRun(["--address", "172.16.0.0/12", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain("policy/exclude");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("added");
    const body = capturedBody as Record<string, unknown>[];
    expect(body).toHaveLength(2);
    expect(body[1]!["address"]).toBe("172.16.0.0/12");
  });

  test("adds with description", async () => {
    let capturedBody: unknown;
    const { ctx } = warpCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
      put: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return body;
      },
    });

    await splitAddRun([
      "--address", "10.0.0.0/8",
      "--description", "VPN range",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    const body = capturedBody as Record<string, unknown>[];
    expect(body).toHaveLength(1);
    expect(body[0]!["description"]).toBe("VPN range");
  });

  test("throws when --address is missing", async () => {
    const { ctx } = warpCtx();
    expect(splitAddRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--address");
  });
});

// ─── WARP Split Tunnels Remove ──────────────────────────────────────────

describe("warp split-tunnels remove", () => {
  test("removes a split tunnel entry", async () => {
    let capturedBody: unknown;
    const existing = [
      sampleSplitEntry(),
      sampleSplitEntry({ address: "192.168.0.0/16", description: "Other" }),
    ];
    const { ctx, output } = warpCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return existing;
      },
      put: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return body;
      },
    });

    await splitRemoveRun(["--address", "10.0.0.0/8", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("removed");
    const body = capturedBody as Record<string, unknown>[];
    expect(body).toHaveLength(1);
    expect(body[0]!["address"]).toBe("192.168.0.0/16");
  });

  test("throws when entry not found", async () => {
    const existing = [sampleSplitEntry()];
    const { ctx } = warpCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return existing;
      },
    });

    expect(splitRemoveRun([
      "--address", "192.168.0.0/16",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("not found");
  });

  test("throws when --address is missing", async () => {
    const { ctx } = warpCtx();
    expect(splitRemoveRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--address");
  });
});

// ─── WARP Fleet Status ──────────────────────────────────────────────────

describe("warp fleet-status", () => {
  test("lists fleet status devices", async () => {
    const devices = [sampleFleetDevice(), sampleFleetDevice({ device_id: "fleet-2", status: "disconnected" })];
    const { ctx, output } = warpCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return devices;
      },
    });

    await fleetStatusRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = warpCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await fleetStatusRun([], ctx);

    expect(capturedPath).toContain("fleet_status");
  });
});

// ─── Routers ────────────────────────────────────────────────────────────

describe("warp main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown warp command");
  });

  test("routes 'settings' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["settings"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'split-tunnels' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["split-tunnels"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'split' alias", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["split"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("warp settings router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await settingsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(settingsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown warp settings command");
  });
});

describe("warp split-tunnels router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await splitRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(splitRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown warp split-tunnels command");
  });
});
