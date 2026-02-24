import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// AI Gateway CRUD
import { run as listRun } from "../../src/commands/ai-gateway/list.js";
import { run as getRun } from "../../src/commands/ai-gateway/get.js";
import { run as createRun } from "../../src/commands/ai-gateway/create.js";
import { run as updateRun } from "../../src/commands/ai-gateway/update.js";
import { run as deleteRun } from "../../src/commands/ai-gateway/delete.js";

// Logs, Datasets, Evaluations
import { run as logsListRun } from "../../src/commands/ai-gateway/logs/list.js";
import { run as datasetsListRun } from "../../src/commands/ai-gateway/datasets/list.js";
import { run as evalsListRun } from "../../src/commands/ai-gateway/evaluations/list.js";

// Routers
import { run as gwRouterRun } from "../../src/commands/ai-gateway/index.js";
import { run as logsRouterRun } from "../../src/commands/ai-gateway/logs/index.js";
import { run as datasetsRouterRun } from "../../src/commands/ai-gateway/datasets/index.js";
import { run as evalsRouterRun } from "../../src/commands/ai-gateway/evaluations/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const GATEWAY_ID = "gw-uuid-123";

function sampleGateway(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: GATEWAY_ID,
    name: "my-gateway",
    slug: "my-gateway",
    rate_limiting_limit: 100,
    rate_limiting_interval: 60,
    rate_limiting_technique: "fixed",
    created_at: "2024-06-01T12:00:00.000Z",
    modified_at: "2024-06-15T12:00:00.000Z",
    ...overrides,
  };
}

function sampleLog(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "log-uuid-123",
    model: "@cf/meta/llama-3-8b-instruct",
    provider: "workers-ai",
    path: "/ai/run/@cf/meta/llama-3-8b-instruct",
    duration: 1500,
    status_code: 200,
    tokens_in: 20,
    tokens_out: 150,
    cost: 0.001,
    cached: false,
    created_at: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleDataset(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "ds-uuid-123",
    name: "my-dataset",
    description: "Training dataset",
    created_at: "2024-06-01T12:00:00.000Z",
    modified_at: "2024-06-15T12:00:00.000Z",
    ...overrides,
  };
}

function sampleEvaluation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "eval-uuid-123",
    name: "my-eval",
    status: "completed",
    created_at: "2024-06-01T12:00:00.000Z",
    modified_at: "2024-06-15T12:00:00.000Z",
    total_count: 100,
    processed_count: 100,
    ...overrides,
  };
}

function gCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── AI Gateway List ──────────────────────────────────────────────────────

describe("ai-gateway list", () => {
  test("lists gateways", async () => {
    const gateways = [sampleGateway(), sampleGateway({ id: "gw-2", name: "other-gw" })];
    const { ctx, output } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return gateways;
      },
    });

    await listRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await listRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
    expect(capturedPath).toContain("/ai-gateway/gateways");
  });
});

// ─── AI Gateway Get ───────────────────────────────────────────────────────

describe("ai-gateway get", () => {
  test("gets a gateway by ID", async () => {
    const gw = sampleGateway();
    const { ctx, output } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return gw;
      },
    });

    await getRun(["--id", GATEWAY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-gateway");
    expect(output.captured.details[0]!["Rate Limit"]).toBe(100);
  });

  test("throws when --id is missing", async () => {
    const { ctx } = gCtx();
    expect(getRun([], ctx)).rejects.toThrow("--id");
  });

  test("includes gateway ID in API path", async () => {
    let capturedPath = "";
    const { ctx } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return sampleGateway();
      },
    });

    await getRun(["--id", GATEWAY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain(GATEWAY_ID);
  });
});

// ─── AI Gateway Create ───────────────────────────────────────────────────

describe("ai-gateway create", () => {
  test("creates a gateway", async () => {
    const gw = sampleGateway();
    let capturedBody: unknown;
    const { ctx, output } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return gw;
      },
    });

    await createRun(["--name", "my-gateway", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("my-gateway");
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("my-gateway");
  });

  test("creates a gateway with --rate-limit", async () => {
    const gw = sampleGateway();
    let capturedBody: unknown;
    const { ctx } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return gw;
      },
    });

    await createRun(["--name", "my-gateway", "--rate-limit", "50", "--account-id", ACCOUNT_ID], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["rate_limiting_limit"]).toBe(50);
  });

  test("throws when --name is missing", async () => {
    const { ctx } = gCtx();
    expect(createRun([], ctx)).rejects.toThrow("--name");
  });
});

// ─── AI Gateway Update ───────────────────────────────────────────────────

describe("ai-gateway update", () => {
  test("updates a gateway name", async () => {
    const gw = sampleGateway({ name: "new-name" });
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return gw;
      },
    });

    await updateRun(["--id", GATEWAY_ID, "--name", "new-name", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(capturedPath).toContain(GATEWAY_ID);
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("new-name");
  });

  test("updates rate limit", async () => {
    const gw = sampleGateway();
    let capturedBody: unknown;
    const { ctx } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      put: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return gw;
      },
    });

    await updateRun(["--id", GATEWAY_ID, "--rate-limit", "200", "--account-id", ACCOUNT_ID], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["rate_limiting_limit"]).toBe(200);
  });

  test("throws when --id is missing", async () => {
    const { ctx } = gCtx();
    expect(updateRun(["--name", "x"], ctx)).rejects.toThrow("--id");
  });

  test("throws when no update fields provided", async () => {
    const { ctx } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
    });
    expect(updateRun(["--id", GATEWAY_ID, "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("At least one");
  });
});

// ─── AI Gateway Delete ───────────────────────────────────────────────────

describe("ai-gateway delete", () => {
  test("deletes a gateway with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await deleteRun(["--id", GATEWAY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(GATEWAY_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = gCtx({}, { yes: undefined });

    await deleteRun(["--id", GATEWAY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = gCtx();
    expect(deleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── AI Gateway Logs List ─────────────────────────────────────────────────

describe("ai-gateway logs list", () => {
  test("lists gateway logs", async () => {
    const logs = [sampleLog(), sampleLog({ id: "log-2" })];
    const { ctx, output } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return logs;
      },
    });

    await logsListRun(["--gateway", GATEWAY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("passes filter params", async () => {
    let capturedParams: Record<string, string> = {};
    const { ctx } = gCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        if (params) capturedParams = params;
        return [];
      },
    });

    await logsListRun([
      "--gateway", GATEWAY_ID,
      "--from", "2024-01-01",
      "--to", "2024-12-31",
      "--model", "llama",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedParams["from"]).toBe("2024-01-01");
    expect(capturedParams["to"]).toBe("2024-12-31");
    expect(capturedParams["model"]).toBe("llama");
  });

  test("throws when --gateway is missing", async () => {
    const { ctx } = gCtx();
    expect(logsListRun([], ctx)).rejects.toThrow("--gateway");
  });

  test("uses correct API path", async () => {
    let capturedPath = "";
    const { ctx } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await logsListRun(["--gateway", GATEWAY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain(`/gateways/${GATEWAY_ID}/logs`);
  });
});

// ─── AI Gateway Datasets List ─────────────────────────────────────────────

describe("ai-gateway datasets list", () => {
  test("lists gateway datasets", async () => {
    const datasets = [sampleDataset(), sampleDataset({ id: "ds-2", name: "other-ds" })];
    const { ctx, output } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return datasets;
      },
    });

    await datasetsListRun(["--gateway", GATEWAY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --gateway is missing", async () => {
    const { ctx } = gCtx();
    expect(datasetsListRun([], ctx)).rejects.toThrow("--gateway");
  });

  test("uses correct API path", async () => {
    let capturedPath = "";
    const { ctx } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await datasetsListRun(["--gateway", GATEWAY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain(`/gateways/${GATEWAY_ID}/datasets`);
  });
});

// ─── AI Gateway Evaluations List ──────────────────────────────────────────

describe("ai-gateway evaluations list", () => {
  test("lists gateway evaluations", async () => {
    const evals = [sampleEvaluation(), sampleEvaluation({ id: "eval-2", name: "other-eval" })];
    const { ctx, output } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return evals;
      },
    });

    await evalsListRun(["--gateway", GATEWAY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --gateway is missing", async () => {
    const { ctx } = gCtx();
    expect(evalsListRun([], ctx)).rejects.toThrow("--gateway");
  });

  test("uses correct API path", async () => {
    let capturedPath = "";
    const { ctx } = gCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await evalsListRun(["--gateway", GATEWAY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain(`/gateways/${GATEWAY_ID}/evaluations`);
  });
});

// ─── Routers ──────────────────────────────────────────────────────────────

describe("ai-gateway router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await gwRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(gwRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown ai-gateway command");
  });

  test("routes to logs with alias 'log'", async () => {
    const { ctx, output } = createTestContext();
    await gwRouterRun(["log"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to evaluations with alias 'evals'", async () => {
    const { ctx, output } = createTestContext();
    await gwRouterRun(["evals"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to datasets with alias 'dataset'", async () => {
    const { ctx, output } = createTestContext();
    await gwRouterRun(["dataset"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("ai-gateway logs router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await logsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(logsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown ai-gateway logs command");
  });
});

describe("ai-gateway datasets router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await datasetsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(datasetsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown ai-gateway datasets command");
  });
});

describe("ai-gateway evaluations router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await evalsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(evalsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown ai-gateway evaluations command");
  });
});
