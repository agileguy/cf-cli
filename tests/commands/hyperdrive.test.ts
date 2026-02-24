import { describe, test, expect } from "bun:test";
import {
  createTestContext,
  sampleHyperdriveConfig,
} from "../helpers.js";

// Hyperdrive
import { run as listRun } from "../../src/commands/hyperdrive/list.js";
import { run as getRun } from "../../src/commands/hyperdrive/get.js";
import { run as createRun } from "../../src/commands/hyperdrive/create.js";
import { run as updateRun } from "../../src/commands/hyperdrive/update.js";
import { run as deleteRun } from "../../src/commands/hyperdrive/delete.js";

// Router
import { run as routerRun } from "../../src/commands/hyperdrive/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const HD_ID = "hd-uuid-123";

function hdCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── Hyperdrive List ──────────────────────────────────────────────────────

describe("hyperdrive list", () => {
  test("lists hyperdrive configs", async () => {
    const configs = [sampleHyperdriveConfig(), sampleHyperdriveConfig({ id: "hd-2", name: "other-hd" })];
    const { ctx, output } = hdCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return configs;
      },
    });

    await listRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = hdCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await listRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
  });
});

// ─── Hyperdrive Get ───────────────────────────────────────────────────────

describe("hyperdrive get", () => {
  test("gets a hyperdrive config by ID", async () => {
    const config = sampleHyperdriveConfig();
    const { ctx, output } = hdCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return config;
      },
    });

    await getRun(["--id", HD_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-hyperdrive");
    expect(output.captured.details[0]!["Host"]).toBe("db.example.com");
    expect(output.captured.details[0]!["Database"]).toBe("mydb");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = hdCtx();
    expect(getRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Hyperdrive Create ────────────────────────────────────────────────────

describe("hyperdrive create", () => {
  test("creates a hyperdrive config with connection string", async () => {
    const config = sampleHyperdriveConfig();
    let capturedBody: unknown;
    const { ctx, output } = hdCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return config;
      },
    });

    await createRun([
      "--name", "my-hyperdrive",
      "--connection-string", "postgres://user:pass@db.example.com:5432/mydb",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("my-hyperdrive");
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("my-hyperdrive");
    const origin = body["origin"] as Record<string, unknown>;
    expect(origin["host"]).toBe("db.example.com");
    expect(origin["port"]).toBe(5432);
    expect(origin["database"]).toBe("mydb");
    expect(origin["scheme"]).toBe("postgres");
    expect(origin["user"]).toBe("user");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = hdCtx();
    expect(createRun(["--connection-string", "postgres://x@y:5432/z"], ctx)).rejects.toThrow("--name");
  });

  test("throws when --connection-string is missing", async () => {
    const { ctx } = hdCtx();
    expect(createRun(["--name", "my-hd"], ctx)).rejects.toThrow("--connection-string");
  });

  test("throws on invalid connection string", async () => {
    const { ctx } = hdCtx();
    expect(createRun([
      "--name", "my-hd",
      "--connection-string", "not-a-valid-url",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Invalid connection string");
  });
});

// ─── Hyperdrive Update ────────────────────────────────────────────────────

describe("hyperdrive update", () => {
  test("updates a hyperdrive name", async () => {
    const config = sampleHyperdriveConfig({ name: "new-name" });
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = hdCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      patch: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return config;
      },
    });

    await updateRun(["--id", HD_ID, "--name", "new-name", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("new-name");
    expect(capturedPath).toContain(HD_ID);
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("new-name");
  });

  test("updates connection string", async () => {
    const config = sampleHyperdriveConfig();
    let capturedBody: unknown;
    const { ctx } = hdCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      patch: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return config;
      },
    });

    await updateRun([
      "--id", HD_ID,
      "--connection-string", "postgres://newuser:newpass@newhost:5433/newdb",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    const body = capturedBody as Record<string, unknown>;
    const origin = body["origin"] as Record<string, unknown>;
    expect(origin["host"]).toBe("newhost");
    expect(origin["port"]).toBe(5433);
    expect(origin["database"]).toBe("newdb");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = hdCtx();
    expect(updateRun(["--name", "x"], ctx)).rejects.toThrow("--id");
  });

  test("throws when neither --name nor --connection-string provided", async () => {
    const { ctx } = hdCtx();
    expect(updateRun(["--id", HD_ID, "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("At least one of");
  });
});

// ─── Hyperdrive Delete ────────────────────────────────────────────────────

describe("hyperdrive delete", () => {
  test("deletes a hyperdrive config with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = hdCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await deleteRun(["--id", HD_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(HD_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = hdCtx({}, { yes: undefined });

    await deleteRun(["--id", HD_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = hdCtx();
    expect(deleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Router ───────────────────────────────────────────────────────────────

describe("hyperdrive router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown hyperdrive command");
  });

  test("routes to list with alias 'ls'", async () => {
    const { ctx, output } = hdCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await routerRun(["ls", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });
});
