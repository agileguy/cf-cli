import { describe, test, expect } from "bun:test";
import {
  createTestContext,
  samplePipeline,
} from "../helpers.js";

// Pipelines
import { run as listRun } from "../../src/commands/pipelines/list.js";
import { run as getRun } from "../../src/commands/pipelines/get.js";
import { run as createRun } from "../../src/commands/pipelines/create.js";
import { run as deleteRun } from "../../src/commands/pipelines/delete.js";

// Router
import { run as routerRun } from "../../src/commands/pipelines/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const PIPELINE_ID = "pipeline-uuid-123";

function plCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── Pipelines List ───────────────────────────────────────────────────────

describe("pipelines list", () => {
  test("lists pipelines", async () => {
    const pipelines = [samplePipeline(), samplePipeline({ id: "pl-2", name: "other-pipeline" })];
    const { ctx, output } = plCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return pipelines;
      },
    });

    await listRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = plCtx({
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

// ─── Pipelines Get ────────────────────────────────────────────────────────

describe("pipelines get", () => {
  test("gets a pipeline by ID", async () => {
    const pipeline = samplePipeline();
    const { ctx, output } = plCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return pipeline;
      },
    });

    await getRun(["--id", PIPELINE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-pipeline");
    expect(output.captured.details[0]!["Endpoint"]).toBe("https://pipeline.example.com/ingest");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = plCtx();
    expect(getRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Pipelines Create ────────────────────────────────────────────────────

describe("pipelines create", () => {
  test("creates a pipeline from config file", async () => {
    const tmpFile = `/tmp/cf-cli-test-pipeline-${Date.now()}.json`;
    const config = {
      source: [{ type: "http", format: "json" }],
      destination: { type: "r2", path: { bucket: "my-bucket" } },
    };
    await Bun.write(tmpFile, JSON.stringify(config));

    const pipeline = samplePipeline();
    let capturedBody: unknown;
    const { ctx, output } = plCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return pipeline;
      },
    });

    await createRun([
      "--name", "my-pipeline",
      "--file", tmpFile,
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("my-pipeline");
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("my-pipeline");
    expect(body["source"]).toBeDefined();
    expect(body["destination"]).toBeDefined();

    // Cleanup
    const { unlinkSync } = await import("fs");
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  });

  test("throws when --name is missing", async () => {
    const { ctx } = plCtx();
    expect(createRun(["--file", "f.json"], ctx)).rejects.toThrow("--name");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = plCtx();
    expect(createRun(["--name", "x"], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = plCtx();
    expect(createRun([
      "--name", "x",
      "--file", "/tmp/nonexistent-cf-cli-pipeline-test.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });

  test("throws when file contains invalid JSON", async () => {
    const tmpFile = `/tmp/cf-cli-test-pipeline-bad-${Date.now()}.json`;
    await Bun.write(tmpFile, "not valid json {{{");

    const { ctx } = plCtx();
    expect(createRun([
      "--name", "x",
      "--file", tmpFile,
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("valid JSON");

    // Cleanup
    const { unlinkSync } = await import("fs");
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  });
});

// ─── Pipelines Delete ─────────────────────────────────────────────────────

describe("pipelines delete", () => {
  test("deletes a pipeline with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = plCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await deleteRun(["--id", PIPELINE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(PIPELINE_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = plCtx({}, { yes: undefined });

    await deleteRun(["--id", PIPELINE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = plCtx();
    expect(deleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Router ───────────────────────────────────────────────────────────────

describe("pipelines router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown pipelines command");
  });

  test("routes to list with alias 'ls'", async () => {
    const { ctx, output } = plCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await routerRun(["ls", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });
});
