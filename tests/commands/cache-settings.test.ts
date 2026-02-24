import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Cache Reserve commands
import { run as crGetRun } from "../../src/commands/cache-reserve/get.js";
import { run as crUpdateRun } from "../../src/commands/cache-reserve/update.js";
import { run as crRouterRun } from "../../src/commands/cache-reserve/index.js";

// Tiered Cache commands
import { run as tcGetRun } from "../../src/commands/tiered-cache/get.js";
import { run as tcUpdateRun } from "../../src/commands/tiered-cache/update.js";
import { run as tcRouterRun } from "../../src/commands/tiered-cache/index.js";

// Argo commands
import { run as argoGetRun } from "../../src/commands/argo/get.js";
import { run as argoUpdateRun } from "../../src/commands/argo/update.js";
import { run as argoRouterRun } from "../../src/commands/argo/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";

function zoneCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
  const originalGet = clientOverrides.get as ((path: string, params?: Record<string, string>) => Promise<unknown>) | undefined;
  return createTestContext(
    {
      ...clientOverrides,
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones") return [{ id: ZONE_ID, name: "example.com" }];
        if (originalGet) return originalGet(path, params);
        return {};
      },
    } as Record<string, unknown>,
    flagOverrides,
  );
}

// ─── Cache Reserve Get ──────────────────────────────────────────────────

describe("cache-reserve get", () => {
  test("gets cache reserve status", async () => {
    const setting = { id: "cache_reserve", value: "on", modified_on: "2024-01-01T00:00:00Z" };
    const { ctx, output } = zoneCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return setting;
      },
    });

    await crGetRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Value"]).toBe("on");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zoneCtx();
    expect(crGetRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Cache Reserve Update ───────────────────────────────────────────────

describe("cache-reserve update", () => {
  test("updates cache reserve", async () => {
    let capturedBody: unknown;
    const { ctx, output } = zoneCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return {};
      },
      patch: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { id: "cache_reserve", value: "on" };
      },
    });

    await crUpdateRun(["--zone", ZONE_ID, "--value", "on"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("on");
    const body = capturedBody as Record<string, unknown>;
    expect(body["value"]).toBe("on");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zoneCtx();
    expect(crUpdateRun(["--value", "on"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --value is missing", async () => {
    const { ctx } = zoneCtx();
    expect(crUpdateRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--value");
  });

  test("throws when --value is invalid", async () => {
    const { ctx } = zoneCtx();
    expect(crUpdateRun(["--zone", ZONE_ID, "--value", "maybe"], ctx)).rejects.toThrow("--value");
  });
});

// ─── Cache Reserve Router ───────────────────────────────────────────────

describe("cache-reserve router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await crRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(crRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown cache-reserve command");
  });
});

// ─── Tiered Cache Get ───────────────────────────────────────────────────

describe("tiered-cache get", () => {
  test("gets tiered cache status", async () => {
    const setting = { id: "tiered_caching", value: "on", modified_on: "2024-01-01T00:00:00Z" };
    const { ctx, output } = zoneCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return setting;
      },
    });

    await tcGetRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Value"]).toBe("on");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zoneCtx();
    expect(tcGetRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Tiered Cache Update ────────────────────────────────────────────────

describe("tiered-cache update", () => {
  test("updates tiered cache", async () => {
    let capturedBody: unknown;
    const { ctx, output } = zoneCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return {};
      },
      patch: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { id: "tiered_caching", value: "on" };
      },
    });

    await tcUpdateRun(["--zone", ZONE_ID, "--value", "on"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("on");
    const body = capturedBody as Record<string, unknown>;
    expect(body["value"]).toBe("on");
  });

  test("passes topology when provided", async () => {
    let capturedBody: unknown;
    const { ctx } = zoneCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return {};
      },
      patch: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { id: "tiered_caching", value: "on" };
      },
    });

    await tcUpdateRun(["--zone", ZONE_ID, "--value", "on", "--topology", "smart"], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["topology"]).toBe("smart");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zoneCtx();
    expect(tcUpdateRun(["--value", "on"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --value is missing", async () => {
    const { ctx } = zoneCtx();
    expect(tcUpdateRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--value");
  });

  test("throws when --value is invalid", async () => {
    const { ctx } = zoneCtx();
    expect(tcUpdateRun(["--zone", ZONE_ID, "--value", "maybe"], ctx)).rejects.toThrow("--value");
  });
});

// ─── Tiered Cache Router ────────────────────────────────────────────────

describe("tiered-cache router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await tcRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(tcRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown tiered-cache command");
  });
});

// ─── Argo Get ───────────────────────────────────────────────────────────

describe("argo get", () => {
  test("gets argo smart routing status", async () => {
    const setting = { id: "smart_routing", value: "on", modified_on: "2024-01-01T00:00:00Z" };
    const { ctx, output } = zoneCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return setting;
      },
    });

    await argoGetRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Value"]).toBe("on");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zoneCtx();
    expect(argoGetRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Argo Update ────────────────────────────────────────────────────────

describe("argo update", () => {
  test("updates argo smart routing", async () => {
    let capturedBody: unknown;
    const { ctx, output } = zoneCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return {};
      },
      patch: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { id: "smart_routing", value: "off" };
      },
    });

    await argoUpdateRun(["--zone", ZONE_ID, "--value", "off"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("off");
    const body = capturedBody as Record<string, unknown>;
    expect(body["value"]).toBe("off");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zoneCtx();
    expect(argoUpdateRun(["--value", "on"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --value is missing", async () => {
    const { ctx } = zoneCtx();
    expect(argoUpdateRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--value");
  });

  test("throws when --value is invalid", async () => {
    const { ctx } = zoneCtx();
    expect(argoUpdateRun(["--zone", ZONE_ID, "--value", "maybe"], ctx)).rejects.toThrow("--value");
  });
});

// ─── Argo Router ────────────────────────────────────────────────────────

describe("argo router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await argoRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(argoRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown argo command");
  });
});
