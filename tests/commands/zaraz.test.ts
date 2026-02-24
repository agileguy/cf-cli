import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Commands
import { run as configGetRun } from "../../src/commands/zaraz/config-get.js";
import { run as configUpdateRun } from "../../src/commands/zaraz/config-update.js";
import { run as publishRun } from "../../src/commands/zaraz/publish.js";
import { run as workflowRun } from "../../src/commands/zaraz/workflow.js";
import { run as historyListRun } from "../../src/commands/zaraz/history-list.js";
import { run as historyGetRun } from "../../src/commands/zaraz/history-get.js";
import { run as exportRun } from "../../src/commands/zaraz/export.js";

// Router
import { run as mainRouterRun } from "../../src/commands/zaraz/index.js";

import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";

function sampleConfig(): Record<string, unknown> {
  return {
    tools: { "google-analytics": { enabled: true } },
    triggers: { pageview: { type: "pageview" } },
    variables: {},
    settings: { auto_inject: true },
  };
}

function sampleHistoryEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    description: "Initial config",
    created_at: "2024-06-01T12:00:00.000Z",
    updated_at: "2024-06-01T12:00:00.000Z",
    user_id: "user-123",
    ...overrides,
  };
}

function zCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
  return createTestContext(
    {
      ...clientOverrides,
    } as Record<string, unknown>,
    flagOverrides,
  );
}

// ─── Config Get ────────────────────────────────────────────────────────

describe("zaraz config get", () => {
  test("gets config for a zone", async () => {
    const config = sampleConfig();
    const { ctx, output } = zCtx({
      get: async () => config,
    });

    await configGetRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(config);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zCtx();
    expect(configGetRun([], ctx)).rejects.toThrow("--zone");
  });

  test("resolves zone name to ID", async () => {
    let capturedPath = "";
    const { ctx } = zCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name === "example.com") {
          return [{ id: ZONE_ID }];
        }
        capturedPath = path;
        return sampleConfig();
      },
    });

    await configGetRun(["--zone", "example.com"], ctx);

    expect(capturedPath).toContain(`/zones/${ZONE_ID}/settings/zaraz/v2/config`);
  });

  test("encodes zone ID in path", async () => {
    let capturedPath = "";
    const { ctx } = zCtx({
      get: async (path: string) => {
        capturedPath = path;
        return sampleConfig();
      },
    });

    await configGetRun(["--zone", ZONE_ID], ctx);

    expect(capturedPath).toContain(`/zones/${ZONE_ID}/settings/zaraz/v2/config`);
  });
});

// ─── Config Update ─────────────────────────────────────────────────────

describe("zaraz config update", () => {
  test("throws when --zone is missing", async () => {
    const { ctx } = zCtx();
    expect(configUpdateRun(["--file", "x.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = zCtx();
    expect(configUpdateRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws on unreadable file", async () => {
    const { ctx } = zCtx({
      put: async () => sampleConfig(),
    });
    expect(configUpdateRun(["--zone", ZONE_ID, "--file", "/nonexistent/config.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Publish ───────────────────────────────────────────────────────────

describe("zaraz publish", () => {
  test("publishes config for a zone", async () => {
    let capturedPath = "";
    const { ctx, output } = zCtx({
      post: async (path: string) => {
        capturedPath = path;
        return { success: true, message: "Published successfully" };
      },
    });

    await publishRun(["--zone", ZONE_ID], ctx);

    expect(capturedPath).toContain(`/zones/${ZONE_ID}/settings/zaraz/v2/publish`);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("Published successfully");
  });

  test("uses default message when API returns none", async () => {
    const { ctx, output } = zCtx({
      post: async () => ({ success: true }),
    });

    await publishRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("published");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zCtx();
    expect(publishRun([], ctx)).rejects.toThrow("--zone");
  });

  test("sends empty body to publish endpoint", async () => {
    let capturedBody: unknown;
    const { ctx } = zCtx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { success: true };
      },
    });

    await publishRun(["--zone", ZONE_ID], ctx);

    expect(capturedBody).toEqual({});
  });
});

// ─── Workflow Get ──────────────────────────────────────────────────────

describe("zaraz workflow get", () => {
  test("gets workflow status", async () => {
    const workflow = { workflow: "realtime" };
    let capturedPath = "";
    const { ctx, output } = zCtx({
      get: async (path: string) => {
        capturedPath = path;
        return workflow;
      },
    });

    await workflowRun(["--zone", ZONE_ID], ctx);

    expect(capturedPath).toContain(`/zones/${ZONE_ID}/settings/zaraz/v2/workflow`);
    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(workflow);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zCtx();
    expect(workflowRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── History List ──────────────────────────────────────────────────────

describe("zaraz history list", () => {
  test("lists history entries", async () => {
    const history = [
      sampleHistoryEntry(),
      sampleHistoryEntry({ id: 2, description: "Updated tools" }),
    ];
    const { ctx, output } = zCtx({
      get: async () => history,
    });

    await historyListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zCtx();
    expect(historyListRun([], ctx)).rejects.toThrow("--zone");
  });

  test("handles empty history", async () => {
    const { ctx, output } = zCtx({
      get: async () => [],
    });

    await historyListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(0);
  });

  test("uses correct API path", async () => {
    let capturedPath = "";
    const { ctx } = zCtx({
      get: async (path: string) => {
        capturedPath = path;
        return [];
      },
    });

    await historyListRun(["--zone", ZONE_ID], ctx);

    expect(capturedPath).toContain(`/zones/${ZONE_ID}/settings/zaraz/v2/history`);
  });
});

// ─── History Get ───────────────────────────────────────────────────────

describe("zaraz history get", () => {
  test("gets a specific history version", async () => {
    const config = sampleConfig();
    let capturedPath = "";
    const { ctx, output } = zCtx({
      get: async (path: string) => {
        capturedPath = path;
        return config;
      },
    });

    await historyGetRun(["--zone", ZONE_ID, "--version", "42"], ctx);

    expect(capturedPath).toContain(`/zones/${ZONE_ID}/settings/zaraz/v2/history/42`);
    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(config);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zCtx();
    expect(historyGetRun(["--version", "1"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --version is missing", async () => {
    const { ctx } = zCtx({
      get: async () => ({}),
    });
    expect(historyGetRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--version");
  });

  test("encodes version in URL path", async () => {
    let capturedPath = "";
    const { ctx } = zCtx({
      get: async (path: string) => {
        capturedPath = path;
        return {};
      },
    });

    await historyGetRun(["--zone", ZONE_ID, "--version", "99"], ctx);

    expect(capturedPath).toContain("/history/99");
  });
});

// ─── Export ────────────────────────────────────────────────────────────

describe("zaraz export", () => {
  test("exports config to a file", async () => {
    const config = sampleConfig();
    const outputFile = join(tmpdir(), `zaraz-test-export-${Date.now()}.json`);
    const { ctx, output } = zCtx({
      get: async () => config,
    });

    try {
      await exportRun(["--zone", ZONE_ID, "--output-file", outputFile], ctx);

      expect(output.captured.successes).toHaveLength(1);
      expect(output.captured.successes[0]).toContain("exported");
      expect(output.captured.successes[0]).toContain(outputFile);

      // Verify file was written
      expect(existsSync(outputFile)).toBe(true);
      const written = JSON.parse(await Bun.file(outputFile).text());
      expect(written).toEqual(config);
    } finally {
      if (existsSync(outputFile)) unlinkSync(outputFile);
    }
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zCtx();
    expect(exportRun(["--output-file", "out.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --output-file is missing", async () => {
    const { ctx } = zCtx({
      get: async () => ({}),
    });
    expect(exportRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--output-file");
  });

  test("uses correct API path for export", async () => {
    let capturedPath = "";
    const outputFile = join(tmpdir(), `zaraz-test-export-path-${Date.now()}.json`);
    const { ctx } = zCtx({
      get: async (path: string) => {
        capturedPath = path;
        return {};
      },
    });

    try {
      await exportRun(["--zone", ZONE_ID, "--output-file", outputFile], ctx);
      expect(capturedPath).toContain(`/zones/${ZONE_ID}/settings/zaraz/v2/export`);
    } finally {
      if (existsSync(outputFile)) unlinkSync(outputFile);
    }
  });
});

// ─── Router ────────────────────────────────────────────────────────────

describe("zaraz main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown zaraz command");
  });

  test("routes 'config get'", async () => {
    const { ctx } = zCtx({
      get: async () => sampleConfig(),
    });
    // Will throw because --zone is missing
    expect(mainRouterRun(["config", "get"], ctx)).rejects.toThrow("--zone");
  });

  test("routes 'config update'", async () => {
    const { ctx } = zCtx();
    // Will throw because --zone is missing
    expect(mainRouterRun(["config", "update"], ctx)).rejects.toThrow("--zone");
  });

  test("throws on unknown config action", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["config", "bogus"], ctx)).rejects.toThrow("Unknown zaraz config action");
  });

  test("routes 'publish'", async () => {
    const { ctx } = zCtx();
    expect(mainRouterRun(["publish"], ctx)).rejects.toThrow("--zone");
  });

  test("routes 'workflow get'", async () => {
    const { ctx } = zCtx();
    expect(mainRouterRun(["workflow", "get"], ctx)).rejects.toThrow("--zone");
  });

  test("throws on unknown workflow action", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["workflow", "bogus"], ctx)).rejects.toThrow("Unknown zaraz workflow action");
  });

  test("routes 'history list'", async () => {
    const { ctx } = zCtx();
    expect(mainRouterRun(["history", "list"], ctx)).rejects.toThrow("--zone");
  });

  test("routes 'history get'", async () => {
    const { ctx } = zCtx();
    expect(mainRouterRun(["history", "get"], ctx)).rejects.toThrow("--zone");
  });

  test("throws on unknown history action", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["history", "bogus"], ctx)).rejects.toThrow("Unknown zaraz history action");
  });

  test("routes 'export'", async () => {
    const { ctx } = zCtx();
    expect(mainRouterRun(["export"], ctx)).rejects.toThrow("--zone");
  });
});
