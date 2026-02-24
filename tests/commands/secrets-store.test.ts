import { describe, test, expect } from "bun:test";
import {
  createTestContext,
  sampleSecretsStore,
  sampleSecretsStoreSecret,
} from "../helpers.js";

// Stores
import { run as storesListRun } from "../../src/commands/secrets-store/stores/list.js";
import { run as storesGetRun } from "../../src/commands/secrets-store/stores/get.js";

// Secrets
import { run as secretsListRun } from "../../src/commands/secrets-store/secrets/list.js";
import { run as secretsGetRun } from "../../src/commands/secrets-store/secrets/get.js";
import { run as secretsPutRun } from "../../src/commands/secrets-store/secrets/put.js";
import { run as secretsDeleteRun } from "../../src/commands/secrets-store/secrets/delete.js";

// Routers
import { run as mainRouterRun } from "../../src/commands/secrets-store/index.js";
import { run as storesRouterRun } from "../../src/commands/secrets-store/stores/index.js";
import { run as secretsRouterRun } from "../../src/commands/secrets-store/secrets/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const STORE_ID = "store-uuid-123";

function ssCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── Stores List ──────────────────────────────────────────────────────────

describe("secrets-store stores list", () => {
  test("lists stores", async () => {
    const stores = [sampleSecretsStore(), sampleSecretsStore({ id: "store-2", name: "other-store" })];
    const { ctx, output } = ssCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return stores;
      },
    });

    await storesListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = ssCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await storesListRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
    expect(capturedPath).toContain("secrets_store/stores");
  });
});

// ─── Stores Get ───────────────────────────────────────────────────────────

describe("secrets-store stores get", () => {
  test("gets a store by ID", async () => {
    const store = sampleSecretsStore();
    const { ctx, output } = ssCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return store;
      },
    });

    await storesGetRun(["--id", STORE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-store");
    expect(output.captured.details[0]!["Status"]).toBe("active");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = ssCtx();
    expect(storesGetRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Secrets List ─────────────────────────────────────────────────────────

describe("secrets-store secrets list", () => {
  test("lists secrets in a store", async () => {
    const secrets = [
      sampleSecretsStoreSecret(),
      sampleSecretsStoreSecret({ name: "OTHER_SECRET" }),
    ];
    const { ctx, output } = ssCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return secrets;
      },
    });

    await secretsListRun(["--store", STORE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --store is missing", async () => {
    const { ctx } = ssCtx();
    expect(secretsListRun([], ctx)).rejects.toThrow("--store");
  });
});

// ─── Secrets Get ──────────────────────────────────────────────────────────

describe("secrets-store secrets get", () => {
  test("gets a secret by name", async () => {
    const secret = sampleSecretsStoreSecret();
    const { ctx, output } = ssCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return secret;
      },
    });

    await secretsGetRun(["--store", STORE_ID, "--name", "MY_SECRET", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("MY_SECRET");
    expect(output.captured.details[0]!["Value"]).toBe("super-secret-value");
  });

  test("throws when --store is missing", async () => {
    const { ctx } = ssCtx();
    expect(secretsGetRun(["--name", "x"], ctx)).rejects.toThrow("--store");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = ssCtx();
    expect(secretsGetRun(["--store", STORE_ID], ctx)).rejects.toThrow("--name");
  });
});

// ─── Secrets Put ──────────────────────────────────────────────────────────

describe("secrets-store secrets put", () => {
  test("puts a secret", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = ssCtx({
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

    await secretsPutRun([
      "--store", STORE_ID,
      "--name", "MY_SECRET",
      "--value", "secret-value",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedPath).toContain(STORE_ID);
    expect(capturedPath).toContain("MY_SECRET");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("written");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("MY_SECRET");
    expect(body["value"]).toBe("secret-value");
  });

  test("puts a secret with comment", async () => {
    let capturedBody: unknown;
    const { ctx } = ssCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      put: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return {};
      },
    });

    await secretsPutRun([
      "--store", STORE_ID,
      "--name", "MY_SECRET",
      "--value", "secret-value",
      "--comment", "API key",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["comment"]).toBe("API key");
  });

  test("throws when --store is missing", async () => {
    const { ctx } = ssCtx();
    expect(secretsPutRun(["--name", "x", "--value", "y"], ctx)).rejects.toThrow("--store");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = ssCtx();
    expect(secretsPutRun(["--store", STORE_ID, "--value", "y"], ctx)).rejects.toThrow("--name");
  });

  test("throws when --value is missing", async () => {
    const { ctx } = ssCtx();
    expect(secretsPutRun(["--store", STORE_ID, "--name", "x"], ctx)).rejects.toThrow("--value");
  });
});

// ─── Secrets Delete ───────────────────────────────────────────────────────

describe("secrets-store secrets delete", () => {
  test("deletes a secret with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = ssCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await secretsDeleteRun([
      "--store", STORE_ID,
      "--name", "MY_SECRET",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(deletedPath).toContain(STORE_ID);
    expect(deletedPath).toContain("MY_SECRET");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = ssCtx({}, { yes: undefined });

    await secretsDeleteRun([
      "--store", STORE_ID,
      "--name", "MY_SECRET",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --store is missing", async () => {
    const { ctx } = ssCtx();
    expect(secretsDeleteRun(["--name", "x"], ctx)).rejects.toThrow("--store");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = ssCtx();
    expect(secretsDeleteRun(["--store", STORE_ID], ctx)).rejects.toThrow("--name");
  });
});

// ─── Routers ──────────────────────────────────────────────────────────────

describe("secrets-store main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown secrets-store command");
  });

  test("routes 'stores' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["stores"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'secrets' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["secrets"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'store' alias", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["store"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'secret' alias", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["secret"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("secrets-store stores router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await storesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(storesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown secrets-store stores command");
  });
});

describe("secrets-store secrets router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await secretsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(secretsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown secrets-store secrets command");
  });
});
