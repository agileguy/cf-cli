import { describe, test, expect } from "bun:test";
import {
  createTestContext,
  sampleDurableObjectNamespace,
  sampleDurableObject,
} from "../helpers.js";

// Durable Objects commands
import { run as doNsListRun } from "../../src/commands/durable-objects/namespaces-list.js";
import { run as doObjectsListRun } from "../../src/commands/durable-objects/objects-list.js";
import { run as doRouterRun } from "../../src/commands/durable-objects/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const DO_NS_ID = "do-ns-uuid-123";

/** Helper: create a test context where --account-id auto-resolves to our test account */
function doCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── Durable Objects Namespaces ────────────────────────────────────────────

describe("durable-objects namespaces list", () => {
  test("lists Durable Object namespaces", async () => {
    const namespaces = [
      sampleDurableObjectNamespace(),
      sampleDurableObjectNamespace({ id: "do-ns-2", name: "ANOTHER_DO" }),
    ];
    const { ctx, output } = doCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return namespaces;
      },
    });

    await doNsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = doCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await doNsListRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
    expect(capturedPath).toContain("durable_objects/namespaces");
  });
});

// ─── Durable Objects List ──────────────────────────────────────────────────

describe("durable-objects list (objects)", () => {
  test("lists objects in a namespace", async () => {
    const objects = [
      sampleDurableObject(),
      sampleDurableObject({ id: "do-obj-2", hasStoredData: false }),
    ];
    const { ctx, output } = doCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return objects;
      },
    });

    await doObjectsListRun(["--namespace-id", DO_NS_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("passes limit and cursor params", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = doCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedParams = params;
        return [];
      },
    });

    await doObjectsListRun([
      "--namespace-id", DO_NS_ID,
      "--limit", "25",
      "--cursor", "cursor-abc",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedParams).toBeDefined();
    expect(capturedParams!["limit"]).toBe("25");
    expect(capturedParams!["cursor"]).toBe("cursor-abc");
  });

  test("throws when --namespace-id is missing", async () => {
    const { ctx } = doCtx();
    expect(doObjectsListRun([], ctx)).rejects.toThrow("--namespace-id");
  });
});

// ─── Durable Objects Router ────────────────────────────────────────────────

describe("durable-objects router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await doRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subresource", async () => {
    const { ctx } = createTestContext();
    expect(doRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown durable-objects subresource");
  });

  test("throws on unknown namespaces subcommand", async () => {
    const { ctx } = createTestContext();
    expect(doRouterRun(["namespaces", "unknown"], ctx)).rejects.toThrow("Unknown durable-objects namespaces command");
  });

  test("routes to namespaces list", async () => {
    const { ctx, output } = doCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await doRouterRun(["namespaces", "list", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'ns' alias to namespaces", async () => {
    const { ctx, output } = doCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await doRouterRun(["ns", "list", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to objects list via 'list'", async () => {
    const { ctx, output } = doCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await doRouterRun(["list", "--namespace-id", DO_NS_ID, "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to objects list via 'ls' alias", async () => {
    const { ctx, output } = doCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await doRouterRun(["ls", "--namespace-id", DO_NS_ID, "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("shows help for namespaces with no subcommand", async () => {
    const { ctx, output } = createTestContext();
    await doRouterRun(["namespaces"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});
