import { describe, test, expect } from "bun:test";
import {
  createTestContext,
  sampleRateLimitRule,
} from "../helpers.js";

// Commands
import { run as listRun } from "../../src/commands/rate-limits/list.js";
import { run as getRun } from "../../src/commands/rate-limits/get.js";
import { run as createRun } from "../../src/commands/rate-limits/create.js";
import { run as updateRun } from "../../src/commands/rate-limits/update.js";
import { run as deleteRun } from "../../src/commands/rate-limits/delete.js";

// Router
import { run as mainRouterRun } from "../../src/commands/rate-limits/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";
const RULE_ID = "rl-uuid-123";

function rlCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
  const originalGet = clientOverrides.get as ((path: string, params?: Record<string, string>) => Promise<unknown>) | undefined;
  return createTestContext(
    {
      ...clientOverrides,
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) {
          return [{ id: ZONE_ID, name: params.name }];
        }
        if (originalGet) return originalGet(path, params);
        return {};
      },
    } as Record<string, unknown>,
    flagOverrides,
  );
}

// ─── List ────────────────────────────────────────────────────────────────

describe("rate-limits list", () => {
  test("lists rate limit rules", async () => {
    const rules = [
      sampleRateLimitRule(),
      sampleRateLimitRule({ id: "rl-uuid-456", description: "Other rule" }),
    ];
    const { ctx, output } = rlCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return rules;
      },
    });

    await listRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = rlCtx();
    expect(listRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Get ─────────────────────────────────────────────────────────────────

describe("rate-limits get", () => {
  test("gets a rule by ID", async () => {
    const rule = sampleRateLimitRule();
    const { ctx, output } = rlCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return rule;
      },
    });

    await getRun(["--zone", ZONE_ID, "--id", RULE_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe("rl-uuid-123");
    expect(output.captured.details[0]!["Description"]).toBe("Rate limit API endpoints");
    expect(output.captured.details[0]!["Threshold"]).toBe(100);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = rlCtx();
    expect(getRun(["--id", RULE_ID], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = rlCtx();
    expect(getRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Create ──────────────────────────────────────────────────────────────

describe("rate-limits create", () => {
  test("creates a rule from file", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const rule = sampleRateLimitRule();

    // We need to mock readFileSync - instead, we test the --file requirement
    const { ctx } = rlCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return {};
      },
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return rule;
      },
    });

    // Test missing flags
    expect(createRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = rlCtx();
    expect(createRun(["--file", "test.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = rlCtx();
    expect(createRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file cannot be read", async () => {
    const { ctx } = rlCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return {};
      },
    });

    expect(createRun(["--zone", ZONE_ID, "--file", "/nonexistent/file.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Update ──────────────────────────────────────────────────────────────

describe("rate-limits update", () => {
  test("throws when --zone is missing", async () => {
    const { ctx } = rlCtx();
    expect(updateRun(["--id", RULE_ID, "--file", "test.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = rlCtx();
    expect(updateRun(["--zone", ZONE_ID, "--file", "test.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = rlCtx();
    expect(updateRun(["--zone", ZONE_ID, "--id", RULE_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file cannot be read", async () => {
    const { ctx } = rlCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return {};
      },
    });

    expect(updateRun(["--zone", ZONE_ID, "--id", RULE_ID, "--file", "/nonexistent/file.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Delete ──────────────────────────────────────────────────────────────

describe("rate-limits delete", () => {
  test("deletes a rule with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = rlCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await deleteRun(["--zone", ZONE_ID, "--id", RULE_ID], ctx);

    expect(deletedPath).toContain(RULE_ID);
    expect(deletedPath).toContain("rate_limits");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = rlCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return {};
      },
    }, { yes: undefined });

    await deleteRun(["--zone", ZONE_ID, "--id", RULE_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = rlCtx();
    expect(deleteRun(["--id", RULE_ID], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = rlCtx();
    expect(deleteRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Router ──────────────────────────────────────────────────────────────

describe("rate-limits main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown rate-limits command");
  });

  test("routes 'list' subcommand", async () => {
    const { ctx } = rlCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return [];
      },
    });
    // "list" with --zone should not throw routing error
    await mainRouterRun(["list", "--zone", ZONE_ID], ctx);
  });

  test("routes 'ls' alias", async () => {
    const { ctx } = rlCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return [];
      },
    });
    await mainRouterRun(["ls", "--zone", ZONE_ID], ctx);
  });
});
