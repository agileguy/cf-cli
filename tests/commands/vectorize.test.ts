import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Vectorize CRUD
import { run as listRun } from "../../src/commands/vectorize/list.js";
import { run as getRun } from "../../src/commands/vectorize/get.js";
import { run as createRun } from "../../src/commands/vectorize/create.js";
import { run as updateRun } from "../../src/commands/vectorize/update.js";
import { run as deleteRun } from "../../src/commands/vectorize/delete.js";

// Insert, Upsert, Query
import { run as queryRun } from "../../src/commands/vectorize/query.js";

// Vectors
import { run as vectorsGetRun } from "../../src/commands/vectorize/vectors/get.js";
import { run as vectorsDeleteRun } from "../../src/commands/vectorize/vectors/delete.js";

// Metadata Index
import { run as metaIndexListRun } from "../../src/commands/vectorize/metadata-index/list.js";
import { run as metaIndexCreateRun } from "../../src/commands/vectorize/metadata-index/create.js";
import { run as metaIndexDeleteRun } from "../../src/commands/vectorize/metadata-index/delete.js";

// Routers
import { run as vectorizeRouterRun } from "../../src/commands/vectorize/index.js";
import { run as vectorsRouterRun } from "../../src/commands/vectorize/vectors/index.js";
import { run as metaIndexRouterRun } from "../../src/commands/vectorize/metadata-index/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const INDEX_NAME = "my-index";

function sampleVectorizeIndex(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: INDEX_NAME,
    description: "My test index",
    config: { dimensions: 768, metric: "cosine" },
    created_on: "2024-06-01T12:00:00.000Z",
    modified_on: "2024-06-15T12:00:00.000Z",
    ...overrides,
  };
}

function sampleQueryResult(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    matches: [
      { id: "vec-1", score: 0.95, metadata: { category: "tech" } },
      { id: "vec-2", score: 0.87, metadata: { category: "science" } },
    ],
    count: 2,
    ...overrides,
  };
}

function sampleVector(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "vec-uuid-123",
    values: [0.1, 0.2, 0.3],
    metadata: { category: "test" },
    ...overrides,
  };
}

function sampleMetadataIndex(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    property_name: "category",
    index_type: "string",
    ...overrides,
  };
}

function vCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── Vectorize List ───────────────────────────────────────────────────────

describe("vectorize list", () => {
  test("lists indexes", async () => {
    const indexes = [sampleVectorizeIndex(), sampleVectorizeIndex({ name: "other-index" })];
    const { ctx, output } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return indexes;
      },
    });

    await listRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await listRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
    expect(capturedPath).toContain("/vectorize/v2/indexes");
  });
});

// ─── Vectorize Get ────────────────────────────────────────────────────────

describe("vectorize get", () => {
  test("gets an index by name", async () => {
    const idx = sampleVectorizeIndex();
    const { ctx, output } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return idx;
      },
    });

    await getRun(["--index", INDEX_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe(INDEX_NAME);
    expect(output.captured.details[0]!["Dimensions"]).toBe(768);
    expect(output.captured.details[0]!["Metric"]).toBe("cosine");
  });

  test("throws when --index is missing", async () => {
    const { ctx } = vCtx();
    expect(getRun([], ctx)).rejects.toThrow("--index");
  });

  test("includes index name in API path", async () => {
    let capturedPath = "";
    const { ctx } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return sampleVectorizeIndex();
      },
    });

    await getRun(["--index", INDEX_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain(INDEX_NAME);
  });
});

// ─── Vectorize Create ─────────────────────────────────────────────────────

describe("vectorize create", () => {
  test("creates an index", async () => {
    const idx = sampleVectorizeIndex();
    let capturedBody: unknown;
    const { ctx, output } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return idx;
      },
    });

    await createRun([
      "--name", INDEX_NAME,
      "--dimensions", "768",
      "--metric", "cosine",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain(INDEX_NAME);
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe(INDEX_NAME);
    const config = body["config"] as Record<string, unknown>;
    expect(config["dimensions"]).toBe(768);
    expect(config["metric"]).toBe("cosine");
  });

  test("creates an index with description", async () => {
    const idx = sampleVectorizeIndex();
    let capturedBody: unknown;
    const { ctx } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return idx;
      },
    });

    await createRun([
      "--name", INDEX_NAME,
      "--dimensions", "768",
      "--metric", "cosine",
      "--description", "Test desc",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["description"]).toBe("Test desc");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = vCtx();
    expect(createRun(["--dimensions", "768", "--metric", "cosine"], ctx)).rejects.toThrow("--name");
  });

  test("throws when --dimensions is missing", async () => {
    const { ctx } = vCtx();
    expect(createRun(["--name", "x", "--metric", "cosine"], ctx)).rejects.toThrow("--dimensions");
  });

  test("throws when --metric is missing", async () => {
    const { ctx } = vCtx();
    expect(createRun(["--name", "x", "--dimensions", "768"], ctx)).rejects.toThrow("--metric");
  });

  test("throws on invalid metric", async () => {
    const { ctx } = vCtx();
    expect(
      createRun(["--name", "x", "--dimensions", "768", "--metric", "invalid"], ctx),
    ).rejects.toThrow("Invalid metric");
  });
});

// ─── Vectorize Update ─────────────────────────────────────────────────────

describe("vectorize update", () => {
  test("updates index description", async () => {
    const idx = sampleVectorizeIndex();
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return idx;
      },
    });

    await updateRun(["--index", INDEX_NAME, "--description", "Updated desc", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(capturedPath).toContain(INDEX_NAME);
    const body = capturedBody as Record<string, unknown>;
    expect(body["description"]).toBe("Updated desc");
  });

  test("throws when --index is missing", async () => {
    const { ctx } = vCtx();
    expect(updateRun(["--description", "x"], ctx)).rejects.toThrow("--index");
  });

  test("throws when --description is missing", async () => {
    const { ctx } = vCtx();
    expect(updateRun(["--index", INDEX_NAME], ctx)).rejects.toThrow("--description");
  });
});

// ─── Vectorize Delete ─────────────────────────────────────────────────────

describe("vectorize delete", () => {
  test("deletes an index with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await deleteRun(["--index", INDEX_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(INDEX_NAME);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = vCtx({}, { yes: undefined });

    await deleteRun(["--index", INDEX_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --index is missing", async () => {
    const { ctx } = vCtx();
    expect(deleteRun([], ctx)).rejects.toThrow("--index");
  });
});

// ─── Vectorize Query ──────────────────────────────────────────────────────

describe("vectorize query", () => {
  test("queries by vector", async () => {
    const result = sampleQueryResult();
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return result;
      },
    });

    await queryRun([
      "--index", INDEX_NAME,
      "--vector", "[0.1, 0.2, 0.3]",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedPath).toContain(`/indexes/${INDEX_NAME}/query`);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
    const body = capturedBody as Record<string, unknown>;
    expect(body["vector"]).toEqual([0.1, 0.2, 0.3]);
  });

  test("passes --top-k flag", async () => {
    const result = sampleQueryResult();
    let capturedBody: unknown;
    const { ctx } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return result;
      },
    });

    await queryRun([
      "--index", INDEX_NAME,
      "--vector", "[0.1, 0.2, 0.3]",
      "--top-k", "5",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["topK"]).toBe(5);
  });

  test("passes --filter flag", async () => {
    const result = sampleQueryResult();
    let capturedBody: unknown;
    const { ctx } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return result;
      },
    });

    await queryRun([
      "--index", INDEX_NAME,
      "--vector", "[0.1]",
      "--filter", '{"category":"tech"}',
      "--account-id", ACCOUNT_ID,
    ], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["filter"]).toEqual({ category: "tech" });
  });

  test("passes --return-metadata flag", async () => {
    const result = sampleQueryResult();
    let capturedBody: unknown;
    const { ctx } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return result;
      },
    });

    await queryRun([
      "--index", INDEX_NAME,
      "--vector", "[0.1]",
      "--return-metadata",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["returnMetadata"]).toBe(true);
  });

  test("passes --return-values flag", async () => {
    const result = sampleQueryResult();
    let capturedBody: unknown;
    const { ctx } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return result;
      },
    });

    await queryRun([
      "--index", INDEX_NAME,
      "--vector", "[0.1]",
      "--return-values",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["returnValues"]).toBe(true);
  });

  test("throws when --index is missing", async () => {
    const { ctx } = vCtx();
    expect(queryRun(["--vector", "[0.1]"], ctx)).rejects.toThrow("--index");
  });

  test("throws when --vector is missing", async () => {
    const { ctx } = vCtx();
    expect(queryRun(["--index", INDEX_NAME], ctx)).rejects.toThrow("--vector");
  });

  test("throws on invalid vector JSON", async () => {
    const { ctx } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
    });
    expect(
      queryRun(["--index", INDEX_NAME, "--vector", "not json", "--account-id", ACCOUNT_ID], ctx),
    ).rejects.toThrow("Invalid vector JSON");
  });

  test("throws on invalid --filter JSON", async () => {
    const { ctx } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
    });
    expect(
      queryRun(["--index", INDEX_NAME, "--vector", "[0.1]", "--filter", "bad", "--account-id", ACCOUNT_ID], ctx),
    ).rejects.toThrow("Invalid filter JSON");
  });
});

// ─── Vectorize Vectors Get ────────────────────────────────────────────────

describe("vectorize vectors get", () => {
  test("gets vectors by IDs", async () => {
    const vectors = [sampleVector(), sampleVector({ id: "vec-2" })];
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return vectors;
      },
    });

    await vectorsGetRun([
      "--index", INDEX_NAME,
      "--ids", "vec-1,vec-2",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedPath).toContain("/get_by_ids");
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
    const body = capturedBody as Record<string, unknown>;
    expect(body["ids"]).toEqual(["vec-1", "vec-2"]);
  });

  test("throws when --index is missing", async () => {
    const { ctx } = vCtx();
    expect(vectorsGetRun(["--ids", "x"], ctx)).rejects.toThrow("--index");
  });

  test("throws when --ids is missing", async () => {
    const { ctx } = vCtx();
    expect(vectorsGetRun(["--index", INDEX_NAME], ctx)).rejects.toThrow("--ids");
  });
});

// ─── Vectorize Vectors Delete ─────────────────────────────────────────────

describe("vectorize vectors delete", () => {
  test("deletes vectors by IDs with --yes", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return { count: 2 };
      },
    });

    await vectorsDeleteRun([
      "--index", INDEX_NAME,
      "--ids", "vec-1,vec-2",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedPath).toContain("/delete_by_ids");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("Deleted");
    expect(output.captured.successes[0]).toContain("2");
    const body = capturedBody as Record<string, unknown>;
    expect(body["ids"]).toEqual(["vec-1", "vec-2"]);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = vCtx({}, { yes: undefined });

    await vectorsDeleteRun([
      "--index", INDEX_NAME,
      "--ids", "vec-1",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --index is missing", async () => {
    const { ctx } = vCtx();
    expect(vectorsDeleteRun(["--ids", "x"], ctx)).rejects.toThrow("--index");
  });

  test("throws when --ids is missing", async () => {
    const { ctx } = vCtx();
    expect(vectorsDeleteRun(["--index", INDEX_NAME], ctx)).rejects.toThrow("--ids");
  });
});

// ─── Vectorize Metadata Index List ────────────────────────────────────────

describe("vectorize metadata-index list", () => {
  test("lists metadata indexes", async () => {
    const indexes = [sampleMetadataIndex(), sampleMetadataIndex({ property_name: "priority", index_type: "number" })];
    const { ctx, output } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return indexes;
      },
    });

    await metaIndexListRun(["--index", INDEX_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --index is missing", async () => {
    const { ctx } = vCtx();
    expect(metaIndexListRun([], ctx)).rejects.toThrow("--index");
  });

  test("uses correct API path", async () => {
    let capturedPath = "";
    const { ctx } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await metaIndexListRun(["--index", INDEX_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain(`/indexes/${INDEX_NAME}/metadata_index`);
  });
});

// ─── Vectorize Metadata Index Create ──────────────────────────────────────

describe("vectorize metadata-index create", () => {
  test("creates a metadata index", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return {};
      },
    });

    await metaIndexCreateRun([
      "--index", INDEX_NAME,
      "--property", "category",
      "--type", "string",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedPath).toContain("/metadata_index");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("category");
    expect(output.captured.successes[0]).toContain("string");
    const body = capturedBody as Record<string, unknown>;
    expect(body["property_name"]).toBe("category");
    expect(body["index_type"]).toBe("string");
  });

  test("throws when --index is missing", async () => {
    const { ctx } = vCtx();
    expect(metaIndexCreateRun(["--property", "x", "--type", "string"], ctx)).rejects.toThrow("--index");
  });

  test("throws when --property is missing", async () => {
    const { ctx } = vCtx();
    expect(metaIndexCreateRun(["--index", INDEX_NAME, "--type", "string"], ctx)).rejects.toThrow("--property");
  });

  test("throws when --type is missing", async () => {
    const { ctx } = vCtx();
    expect(metaIndexCreateRun(["--index", INDEX_NAME, "--property", "x"], ctx)).rejects.toThrow("--type");
  });
});

// ─── Vectorize Metadata Index Delete ──────────────────────────────────────

describe("vectorize metadata-index delete", () => {
  test("deletes a metadata index with --yes", async () => {
    let deletedPath = "";
    let deletedBody: unknown;
    const { ctx, output } = vCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string, body?: unknown) => {
        deletedPath = path;
        deletedBody = body;
        return {};
      },
    });

    await metaIndexDeleteRun([
      "--index", INDEX_NAME,
      "--property", "category",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(deletedPath).toContain("/metadata_index");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("category");
    expect(output.captured.successes[0]).toContain("deleted");
    const body = deletedBody as Record<string, unknown>;
    expect(body["property_name"]).toBe("category");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = vCtx({}, { yes: undefined });

    await metaIndexDeleteRun([
      "--index", INDEX_NAME,
      "--property", "category",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --index is missing", async () => {
    const { ctx } = vCtx();
    expect(metaIndexDeleteRun(["--property", "x"], ctx)).rejects.toThrow("--index");
  });

  test("throws when --property is missing", async () => {
    const { ctx } = vCtx();
    expect(metaIndexDeleteRun(["--index", INDEX_NAME], ctx)).rejects.toThrow("--property");
  });
});

// ─── Routers ──────────────────────────────────────────────────────────────

describe("vectorize router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await vectorizeRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(vectorizeRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown vectorize command");
  });

  test("routes to vectors with alias 'vector'", async () => {
    const { ctx, output } = createTestContext();
    await vectorizeRouterRun(["vector"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to metadata-index with alias 'meta-index'", async () => {
    const { ctx, output } = createTestContext();
    await vectorizeRouterRun(["meta-index"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to query with alias 'search'", async () => {
    const { ctx } = vCtx();
    // 'search' alias should route to query, which requires --index
    expect(vectorizeRouterRun(["search"], ctx)).rejects.toThrow("--index");
  });
});

describe("vectorize vectors router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await vectorsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(vectorsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown vectorize vectors command");
  });
});

describe("vectorize metadata-index router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await metaIndexRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(metaIndexRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown vectorize metadata-index command");
  });
});
