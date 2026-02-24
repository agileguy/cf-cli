import { describe, test, expect } from "bun:test";
import {
  createTestContext,
  sampleKVNamespace,
  sampleKVKey,
} from "../helpers.js";

// KV Namespaces
import { run as nsListRun } from "../../src/commands/kv/namespaces/list.js";
import { run as nsGetRun } from "../../src/commands/kv/namespaces/get.js";
import { run as nsCreateRun } from "../../src/commands/kv/namespaces/create.js";
import { run as nsRenameRun } from "../../src/commands/kv/namespaces/rename.js";
import { run as nsDeleteRun } from "../../src/commands/kv/namespaces/delete.js";
import { run as nsRouterRun } from "../../src/commands/kv/namespaces/index.js";

// KV Keys
import { run as kvListRun } from "../../src/commands/kv/list.js";
import { run as kvGetRun } from "../../src/commands/kv/get.js";
import { run as kvPutRun } from "../../src/commands/kv/put.js";
import { run as kvDeleteRun } from "../../src/commands/kv/delete.js";
import { run as kvBulkWriteRun } from "../../src/commands/kv/bulk-write.js";
import { run as kvBulkDeleteRun } from "../../src/commands/kv/bulk-delete.js";

// KV Router
import { run as kvRouterRun } from "../../src/commands/kv/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const NS_ID = "kv-ns-uuid-123";

/** Helper: create a test context where --account-id auto-resolves to our test account */
function kvCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── KV Namespaces ─────────────────────────────────────────────────────────

describe("kv namespaces list", () => {
  test("lists KV namespaces", async () => {
    const namespaces = [sampleKVNamespace(), sampleKVNamespace({ id: "ns-2", title: "OTHER_NS" })];
    const { ctx, output } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return namespaces;
      },
    });

    await nsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await nsListRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
  });
});

describe("kv namespaces get", () => {
  test("gets a namespace by ID", async () => {
    const ns = sampleKVNamespace();
    const { ctx, output } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return ns;
      },
    });

    await nsGetRun(["--id", NS_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Title"]).toBe("MY_KV_NAMESPACE");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = kvCtx();
    expect(nsGetRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("kv namespaces create", () => {
  test("creates a namespace", async () => {
    const ns = sampleKVNamespace();
    let capturedBody: unknown;
    const { ctx, output } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return ns;
      },
    });

    await nsCreateRun(["--title", "MY_KV_NAMESPACE", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("MY_KV_NAMESPACE");
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["title"]).toBe("MY_KV_NAMESPACE");
  });

  test("throws when --title is missing", async () => {
    const { ctx } = kvCtx();
    expect(nsCreateRun([], ctx)).rejects.toThrow("--title");
  });
});

describe("kv namespaces rename", () => {
  test("renames a namespace", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return {};
      },
    });

    await nsRenameRun(["--id", NS_ID, "--title", "NEW_TITLE", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("NEW_TITLE");
    expect(capturedPath).toContain(NS_ID);
    const body = capturedBody as Record<string, unknown>;
    expect(body["title"]).toBe("NEW_TITLE");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = kvCtx();
    expect(nsRenameRun(["--title", "X"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --title is missing", async () => {
    const { ctx } = kvCtx();
    expect(nsRenameRun(["--id", NS_ID], ctx)).rejects.toThrow("--title");
  });
});

describe("kv namespaces delete", () => {
  test("deletes a namespace with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await nsDeleteRun(["--id", NS_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(NS_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = kvCtx({}, { yes: undefined });

    await nsDeleteRun(["--id", NS_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = kvCtx();
    expect(nsDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("kv namespaces router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await nsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(nsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown kv namespaces command");
  });
});

// ─── KV Keys ───────────────────────────────────────────────────────────────

describe("kv list (keys)", () => {
  test("lists keys in a namespace", async () => {
    const keys = [sampleKVKey(), sampleKVKey({ name: "key-2" })];
    const { ctx, output } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return keys;
      },
    });

    await kvListRun(["--namespace-id", NS_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("passes prefix, limit, cursor params", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = kvCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedParams = params;
        return [];
      },
    });

    await kvListRun([
      "--namespace-id", NS_ID,
      "--prefix", "config:",
      "--limit", "10",
      "--cursor", "abc123",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedParams).toBeDefined();
    expect(capturedParams!["prefix"]).toBe("config:");
    expect(capturedParams!["limit"]).toBe("10");
    expect(capturedParams!["cursor"]).toBe("abc123");
  });

  test("throws when --namespace-id is missing", async () => {
    const { ctx } = kvCtx();
    expect(kvListRun([], ctx)).rejects.toThrow("--namespace-id");
  });
});

describe("kv get", () => {
  test("gets a key value", async () => {
    const { ctx, output } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return "hello world";
      },
    });

    await kvGetRun(["--namespace-id", NS_ID, "--key", "my-key", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.raws).toHaveLength(1);
    expect(output.captured.raws[0]).toBe("hello world");
  });

  test("throws when --namespace-id is missing", async () => {
    const { ctx } = kvCtx();
    expect(kvGetRun(["--key", "my-key"], ctx)).rejects.toThrow("--namespace-id");
  });

  test("throws when --key is missing", async () => {
    const { ctx } = kvCtx();
    expect(kvGetRun(["--namespace-id", NS_ID], ctx)).rejects.toThrow("--key");
  });
});

describe("kv put", () => {
  test("puts a key-value pair with --value", async () => {
    let capturedPath = "";
    let capturedBody: unknown;
    const { ctx, output } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return {};
      },
    });

    await kvPutRun([
      "--namespace-id", NS_ID,
      "--key", "my-key",
      "--value", "my-value",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedPath).toContain(NS_ID);
    expect(capturedPath).toContain("my-key");
    expect(capturedBody).toBe("my-value");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("written");
  });

  test("puts a key-value pair from --file", async () => {
    const tmpFile = `/tmp/cf-cli-test-kv-put-${Date.now()}.txt`;
    await Bun.write(tmpFile, "file-content-here");

    let capturedBody: unknown;
    const { ctx, output } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      put: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return {};
      },
    });

    await kvPutRun([
      "--namespace-id", NS_ID,
      "--key", "my-file-key",
      "--file", tmpFile,
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedBody).toBe("file-content-here");
    expect(output.captured.successes).toHaveLength(1);

    // Cleanup
    const { unlinkSync } = await import("fs");
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  });

  test("throws when --namespace-id is missing", async () => {
    const { ctx } = kvCtx();
    expect(kvPutRun(["--key", "k", "--value", "v"], ctx)).rejects.toThrow("--namespace-id");
  });

  test("throws when --key is missing", async () => {
    const { ctx } = kvCtx();
    expect(kvPutRun(["--namespace-id", NS_ID, "--value", "v"], ctx)).rejects.toThrow("--key");
  });

  test("throws when neither --value nor --file provided", async () => {
    const { ctx } = kvCtx();
    expect(kvPutRun(["--namespace-id", NS_ID, "--key", "k", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--value");
  });

  test("throws when --file does not exist", async () => {
    const { ctx } = kvCtx();
    expect(kvPutRun([
      "--namespace-id", NS_ID,
      "--key", "k",
      "--file", "/tmp/nonexistent-cf-cli-test-file.txt",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

describe("kv delete", () => {
  test("deletes a key with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await kvDeleteRun([
      "--namespace-id", NS_ID,
      "--key", "my-key",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(deletedPath).toContain(NS_ID);
    expect(deletedPath).toContain("my-key");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = kvCtx({}, { yes: undefined });

    await kvDeleteRun([
      "--namespace-id", NS_ID,
      "--key", "my-key",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --namespace-id is missing", async () => {
    const { ctx } = kvCtx();
    expect(kvDeleteRun(["--key", "k"], ctx)).rejects.toThrow("--namespace-id");
  });

  test("throws when --key is missing", async () => {
    const { ctx } = kvCtx();
    expect(kvDeleteRun(["--namespace-id", NS_ID], ctx)).rejects.toThrow("--key");
  });
});

describe("kv bulk-write", () => {
  test("bulk writes from JSON file", async () => {
    const tmpFile = `/tmp/cf-cli-test-bulk-write-${Date.now()}.json`;
    const entries = [
      { key: "k1", value: "v1" },
      { key: "k2", value: "v2" },
    ];
    await Bun.write(tmpFile, JSON.stringify(entries));

    let capturedPath = "";
    let capturedBody: unknown;
    const { ctx, output } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return {};
      },
    });

    await kvBulkWriteRun([
      "--namespace-id", NS_ID,
      "--file", tmpFile,
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedPath).toContain(NS_ID);
    expect(capturedPath).toContain("/bulk");
    expect(capturedBody).toEqual(entries);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("2 key(s)");

    // Cleanup
    const { unlinkSync } = await import("fs");
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  });

  test("throws when --namespace-id is missing", async () => {
    const { ctx } = kvCtx();
    expect(kvBulkWriteRun(["--file", "f.json"], ctx)).rejects.toThrow("--namespace-id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = kvCtx();
    expect(kvBulkWriteRun(["--namespace-id", NS_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = kvCtx();
    expect(kvBulkWriteRun([
      "--namespace-id", NS_ID,
      "--file", "/tmp/nonexistent-cf-cli-test.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });

  test("throws when file contains invalid JSON", async () => {
    const tmpFile = `/tmp/cf-cli-test-bad-json-${Date.now()}.json`;
    await Bun.write(tmpFile, "not valid json {{{");

    const { ctx } = kvCtx();
    expect(kvBulkWriteRun([
      "--namespace-id", NS_ID,
      "--file", tmpFile,
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("valid JSON");

    // Cleanup
    const { unlinkSync } = await import("fs");
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  });
});

describe("kv bulk-delete", () => {
  test("bulk deletes from JSON file with --yes", async () => {
    const tmpFile = `/tmp/cf-cli-test-bulk-delete-${Date.now()}.json`;
    const keys = ["key1", "key2", "key3"];
    await Bun.write(tmpFile, JSON.stringify(keys));

    let deletedPath = "";
    const { ctx, output } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await kvBulkDeleteRun([
      "--namespace-id", NS_ID,
      "--file", tmpFile,
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(deletedPath).toContain(NS_ID);
    expect(deletedPath).toContain("/bulk");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("3 key(s)");

    // Cleanup
    const { unlinkSync } = await import("fs");
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  });

  test("aborts when confirmation denied", async () => {
    const tmpFile = `/tmp/cf-cli-test-bulk-delete-abort-${Date.now()}.json`;
    await Bun.write(tmpFile, JSON.stringify(["k1"]));

    const { ctx, output } = kvCtx({}, { yes: undefined });

    await kvBulkDeleteRun([
      "--namespace-id", NS_ID,
      "--file", tmpFile,
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");

    // Cleanup
    const { unlinkSync } = await import("fs");
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  });

  test("throws when --namespace-id is missing", async () => {
    const { ctx } = kvCtx();
    expect(kvBulkDeleteRun(["--file", "f.json"], ctx)).rejects.toThrow("--namespace-id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = kvCtx();
    expect(kvBulkDeleteRun(["--namespace-id", NS_ID], ctx)).rejects.toThrow("--file");
  });
});

// ─── KV Main Router ────────────────────────────────────────────────────────

describe("kv router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await kvRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(kvRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown kv command");
  });

  test("routes to namespaces subcommand", async () => {
    const { ctx, output } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await kvRouterRun(["namespaces", "list", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to list with alias 'ls'", async () => {
    const { ctx, output } = kvCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await kvRouterRun(["ls", "--namespace-id", NS_ID, "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'ns' alias to namespaces", async () => {
    const { ctx, output } = createTestContext();
    await kvRouterRun(["ns"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});
