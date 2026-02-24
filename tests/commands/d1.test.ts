import { describe, test, expect } from "bun:test";
import {
  createTestContext,
  sampleD1Database,
  sampleD1QueryResult,
} from "../helpers.js";

// D1 Commands
import { run as d1ListRun } from "../../src/commands/d1/list.js";
import { run as d1GetRun } from "../../src/commands/d1/get.js";
import { run as d1CreateRun } from "../../src/commands/d1/create.js";
import { run as d1UpdateRun } from "../../src/commands/d1/update.js";
import { run as d1DeleteRun } from "../../src/commands/d1/delete.js";
import { run as d1QueryRun } from "../../src/commands/d1/query.js";
import { run as d1ImportRun } from "../../src/commands/d1/import.js";

// D1 Router
import { run as d1RouterRun } from "../../src/commands/d1/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const DB_ID = "d1-uuid-123";

/** Helper: create a test context with auto-resolving account ID */
function d1Ctx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── D1 List ────────────────────────────────────────────────────────────

describe("d1 list", () => {
  test("lists D1 databases", async () => {
    const databases = [sampleD1Database(), sampleD1Database({ uuid: "d1-uuid-456", name: "other-db" })];
    const { ctx, output } = d1Ctx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return databases;
      },
    });

    await d1ListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = d1Ctx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await d1ListRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
  });
});

// ─── D1 Get ─────────────────────────────────────────────────────────────

describe("d1 get", () => {
  test("gets a database by ID", async () => {
    const db = sampleD1Database();
    const { ctx, output } = d1Ctx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return db;
      },
    });

    await d1GetRun(["--database", DB_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe("d1-uuid-123");
    expect(output.captured.details[0]!["Name"]).toBe("my-database");
  });

  test("throws when --database is missing", async () => {
    const { ctx } = d1Ctx();
    expect(d1GetRun([], ctx)).rejects.toThrow("--database");
  });
});

// ─── D1 Create ──────────────────────────────────────────────────────────

describe("d1 create", () => {
  test("creates a database", async () => {
    const db = sampleD1Database();
    let capturedBody: unknown;
    const { ctx, output } = d1Ctx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return db;
      },
    });

    await d1CreateRun(["--name", "my-database", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("my-database");
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("my-database");
  });

  test("passes location hint", async () => {
    let capturedBody: unknown;
    const { ctx } = d1Ctx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleD1Database();
      },
    });

    await d1CreateRun(["--name", "my-database", "--location", "WNAM", "--account-id", ACCOUNT_ID], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["primary_location_hint"]).toBe("WNAM");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = d1Ctx();
    expect(d1CreateRun([], ctx)).rejects.toThrow("--name");
  });
});

// ─── D1 Update ──────────────────────────────────────────────────────────

describe("d1 update", () => {
  test("updates a database", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = d1Ctx({
      patch: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return {};
      },
    });

    await d1UpdateRun(["--database", DB_ID, "--name", "new-name", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(capturedPath).toContain(DB_ID);
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("new-name");
  });

  test("throws when --database is missing", async () => {
    const { ctx } = d1Ctx();
    expect(d1UpdateRun(["--name", "x"], ctx)).rejects.toThrow("--database");
  });

  test("throws when no update flag provided", async () => {
    const { ctx } = d1Ctx();
    expect(d1UpdateRun(["--database", DB_ID, "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("at least one update flag");
  });
});

// ─── D1 Delete ──────────────────────────────────────────────────────────

describe("d1 delete", () => {
  test("deletes a database with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = d1Ctx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await d1DeleteRun(["--database", DB_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(DB_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = d1Ctx({}, { yes: undefined });

    await d1DeleteRun(["--database", DB_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --database is missing", async () => {
    const { ctx } = d1Ctx();
    expect(d1DeleteRun([], ctx)).rejects.toThrow("--database");
  });
});

// ─── D1 Query ───────────────────────────────────────────────────────────

describe("d1 query", () => {
  test("executes a SQL query and shows table output", async () => {
    const result = sampleD1QueryResult();
    let capturedBody: unknown;
    const { ctx, output } = d1Ctx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return [result];
      },
    });

    await d1QueryRun(["--database", DB_ID, "SELECT * FROM users", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
    const body = capturedBody as Record<string, unknown>;
    expect(body["sql"]).toBe("SELECT * FROM users");
  });

  test("passes params when provided", async () => {
    let capturedBody: unknown;
    const { ctx } = d1Ctx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return [sampleD1QueryResult()];
      },
    });

    await d1QueryRun(["--database", DB_ID, "SELECT * FROM users WHERE id = ?", "--params", "[1]", "--account-id", ACCOUNT_ID], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["params"]).toEqual([1]);
  });

  test("shows info for queries with no results", async () => {
    const emptyResult = { results: [], success: true, meta: { changes: 5, duration: 1.2 } };
    const { ctx, output } = d1Ctx({
      post: async () => [emptyResult],
    });

    await d1QueryRun(["--database", DB_ID, "DELETE FROM tmp", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos).toHaveLength(1);
    expect(output.captured.infos[0]).toContain("Query OK");
  });

  test("supports JSON output", async () => {
    const result = sampleD1QueryResult();
    const { ctx, output } = d1Ctx({
      post: async () => [result],
    }, { output: "json" });

    await d1QueryRun(["--database", DB_ID, "SELECT * FROM users", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("supports CSV output", async () => {
    const result = sampleD1QueryResult();
    const { ctx, output } = d1Ctx({
      post: async () => [result],
    }, { output: "csv" });

    await d1QueryRun(["--database", DB_ID, "SELECT * FROM users", "--output", "csv", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.csvs).toHaveLength(1);
  });

  test("throws when --database is missing", async () => {
    const { ctx } = d1Ctx();
    expect(d1QueryRun(["SELECT 1"], ctx)).rejects.toThrow("--database");
  });

  test("throws when SQL is missing", async () => {
    const { ctx } = d1Ctx();
    expect(d1QueryRun(["--database", DB_ID], ctx)).rejects.toThrow("SQL query is required");
  });

  test("throws when --params has invalid JSON", async () => {
    const { ctx } = d1Ctx();
    expect(d1QueryRun(["--database", DB_ID, "SELECT 1", "--params", "not-json", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("valid JSON");
  });
});

// ─── D1 Import ──────────────────────────────────────────────────────────

describe("d1 import", () => {
  test("imports SQL from file", async () => {
    const tmpFile = `/tmp/cf-cli-test-d1-import-${Date.now()}.sql`;
    await Bun.write(tmpFile, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);");

    let capturedBody: unknown;
    const { ctx, output } = d1Ctx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return {};
      },
    });

    await d1ImportRun(["--database", DB_ID, "--file", tmpFile, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("imported");
    const body = capturedBody as Record<string, unknown>;
    expect(body["sql"]).toContain("CREATE TABLE users");

    const { unlinkSync } = await import("fs");
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  });

  test("throws when --database is missing", async () => {
    const { ctx } = d1Ctx();
    expect(d1ImportRun(["--file", "f.sql"], ctx)).rejects.toThrow("--database");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = d1Ctx();
    expect(d1ImportRun(["--database", DB_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = d1Ctx();
    expect(d1ImportRun(["--database", DB_ID, "--file", "/tmp/nonexistent-cf-d1-test.sql", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("Could not read file");
  });
});

// ─── D1 Router ──────────────────────────────────────────────────────────

describe("d1 router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await d1RouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(d1RouterRun(["unknown"], ctx)).rejects.toThrow("Unknown d1 command");
  });

  test("routes to list with alias 'ls'", async () => {
    const { ctx, output } = d1Ctx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await d1RouterRun(["ls", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'sql' alias to query", async () => {
    const { ctx } = d1Ctx({
      post: async () => [{ results: [], success: true, meta: { changes: 0, duration: 0 } }],
    });
    // This should not throw (routes to query which then throws for missing --database)
    expect(d1RouterRun(["sql", "--database", DB_ID, "SELECT 1", "--account-id", ACCOUNT_ID], ctx)).resolves.toBeUndefined();
  });
});
