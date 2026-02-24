import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Calls Apps
import { run as appsListRun } from "../../src/commands/calls/apps/list.js";
import { run as appsCreateRun } from "../../src/commands/calls/apps/create.js";
import { run as appsGetRun } from "../../src/commands/calls/apps/get.js";
import { run as appsDeleteRun } from "../../src/commands/calls/apps/delete.js";

// Calls TURN Keys
import { run as turnKeysListRun } from "../../src/commands/calls/turn-keys/list.js";
import { run as turnKeysCreateRun } from "../../src/commands/calls/turn-keys/create.js";
import { run as turnKeysDeleteRun } from "../../src/commands/calls/turn-keys/delete.js";

// Routers
import { run as callsRouterRun } from "../../src/commands/calls/index.js";
import { run as appsRouterRun } from "../../src/commands/calls/apps/index.js";
import { run as turnKeysRouterRun } from "../../src/commands/calls/turn-keys/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";

function sampleCallsApp(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    uid: "app-uuid-123",
    name: "my-calls-app",
    created: "2024-06-01T12:00:00.000Z",
    modified: "2024-06-15T12:00:00.000Z",
    ...overrides,
  };
}

function sampleTurnKey(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    key_id: "key-uuid-123",
    name: "my-turn-key",
    created: "2024-06-01T12:00:00.000Z",
    modified: "2024-06-15T12:00:00.000Z",
    ...overrides,
  };
}

function cCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
  const originalGet = clientOverrides.get as ((path: string, params?: Record<string, string>) => Promise<unknown>) | undefined;
  return createTestContext(
    {
      ...clientOverrides,
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") {
          return [{ id: ACCOUNT_ID, name: "Test Account" }];
        }
        if (originalGet) return originalGet(path, params);
        return {};
      },
    } as Record<string, unknown>,
    flagOverrides,
  );
}

// ─── Calls Apps List ──────────────────────────────────────────────────────

describe("calls apps list", () => {
  test("lists apps", async () => {
    const apps = [sampleCallsApp(), sampleCallsApp({ uid: "app-2", name: "other-app" })];
    const { ctx, output } = cCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return apps;
      },
    });

    await appsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = cCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await appsListRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
    expect(capturedPath).toContain("/calls/apps");
  });
});

// ─── Calls Apps Create ────────────────────────────────────────────────────

describe("calls apps create", () => {
  test("creates an app", async () => {
    const app = sampleCallsApp();
    let capturedBody: unknown;
    const { ctx, output } = cCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return app;
      },
    });

    await appsCreateRun(["--name", "my-calls-app", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("my-calls-app");
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("my-calls-app");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = cCtx();
    expect(appsCreateRun([], ctx)).rejects.toThrow("--name");
  });
});

// ─── Calls Apps Get ───────────────────────────────────────────────────────

describe("calls apps get", () => {
  test("gets an app by ID", async () => {
    const app = sampleCallsApp();
    const { ctx, output } = cCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return app;
      },
    });

    await appsGetRun(["--id", "app-uuid-123", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-calls-app");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = cCtx();
    expect(appsGetRun([], ctx)).rejects.toThrow("--id");
  });

  test("includes app ID in API path", async () => {
    let capturedPath = "";
    const { ctx } = cCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return sampleCallsApp();
      },
    });

    await appsGetRun(["--id", "app-uuid-123", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain("app-uuid-123");
  });
});

// ─── Calls Apps Delete ────────────────────────────────────────────────────

describe("calls apps delete", () => {
  test("deletes an app with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = cCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await appsDeleteRun(["--id", "app-uuid-123", "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain("app-uuid-123");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = cCtx({}, { yes: undefined });

    await appsDeleteRun(["--id", "app-uuid-123", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = cCtx();
    expect(appsDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Calls TURN Keys List ─────────────────────────────────────────────────

describe("calls turn-keys list", () => {
  test("lists TURN keys", async () => {
    const keys = [sampleTurnKey(), sampleTurnKey({ key_id: "key-2", name: "other-key" })];
    const { ctx, output } = cCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return keys;
      },
    });

    await turnKeysListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("uses correct API path", async () => {
    let capturedPath = "";
    const { ctx } = cCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await turnKeysListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain("/calls/turn_keys");
  });
});

// ─── Calls TURN Keys Create ──────────────────────────────────────────────

describe("calls turn-keys create", () => {
  test("creates a TURN key", async () => {
    const key = sampleTurnKey();
    let capturedBody: unknown;
    const { ctx, output } = cCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return key;
      },
    });

    await turnKeysCreateRun(["--name", "my-turn-key", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("my-turn-key");
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("my-turn-key");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = cCtx();
    expect(turnKeysCreateRun([], ctx)).rejects.toThrow("--name");
  });
});

// ─── Calls TURN Keys Delete ──────────────────────────────────────────────

describe("calls turn-keys delete", () => {
  test("deletes a TURN key with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = cCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await turnKeysDeleteRun(["--id", "key-uuid-123", "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain("key-uuid-123");
    expect(deletedPath).toContain("/calls/turn_keys/");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = cCtx({}, { yes: undefined });

    await turnKeysDeleteRun(["--id", "key-uuid-123", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = cCtx();
    expect(turnKeysDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Routers ──────────────────────────────────────────────────────────────

describe("calls router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await callsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(callsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown calls command");
  });

  test("routes to apps", async () => {
    const { ctx, output } = createTestContext();
    await callsRouterRun(["apps"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to turn-keys", async () => {
    const { ctx, output } = createTestContext();
    await callsRouterRun(["turn-keys"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("calls apps router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await appsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(appsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown calls apps command");
  });
});

describe("calls turn-keys router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await turnKeysRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(turnKeysRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown calls turn-keys command");
  });
});
