import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// AI Run
import { run as aiRunRun } from "../../src/commands/ai/run.js";

// AI Models
import { run as modelsListRun } from "../../src/commands/ai/models/list.js";
import { run as modelsGetRun } from "../../src/commands/ai/models/get.js";

// AI Fine-Tuning
import { run as ftListRun } from "../../src/commands/ai/fine-tuning/list.js";
import { run as ftGetRun } from "../../src/commands/ai/fine-tuning/get.js";
import { run as ftDeleteRun } from "../../src/commands/ai/fine-tuning/delete.js";

// Routers
import { run as aiRouterRun } from "../../src/commands/ai/index.js";
import { run as modelsRouterRun } from "../../src/commands/ai/models/index.js";
import { run as ftRouterRun } from "../../src/commands/ai/fine-tuning/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";

function sampleAIModel(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "model-uuid-123",
    name: "@cf/meta/llama-3-8b-instruct",
    description: "Meta Llama 3 8B Instruct",
    task: { id: "text-generation", name: "Text Generation", description: "Generate text" },
    properties: [{ property_id: "beta", value: "false" }],
    ...overrides,
  };
}

function sampleFineTune(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "ft-uuid-123",
    model: "@cf/meta/llama-3-8b-instruct",
    name: "my-fine-tune",
    description: "Custom fine-tune",
    status: "running",
    created_at: "2024-06-01T12:00:00.000Z",
    modified_at: "2024-06-15T12:00:00.000Z",
    ...overrides,
  };
}

function aCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── AI Run ───────────────────────────────────────────────────────────────

describe("ai run", () => {
  test("runs text inference with --prompt", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return { response: "DNS stands for Domain Name System." };
      },
    });

    await aiRunRun(["@cf/meta/llama-3-8b-instruct", "--prompt", "What is DNS?", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain("/ai/run/");
    expect(capturedPath).toContain("llama-3-8b-instruct");
    expect(output.captured.raws).toHaveLength(1);
    expect(output.captured.raws[0]).toContain("DNS");
    const body = capturedBody as Record<string, unknown>;
    expect(body["messages"]).toBeDefined();
  });

  test("throws when model is missing", async () => {
    const { ctx } = aCtx();
    expect(aiRunRun(["--prompt", "hello"], ctx)).rejects.toThrow("Model name is required");
  });

  test("throws when neither --prompt nor --file is provided", async () => {
    const { ctx } = aCtx();
    expect(aiRunRun(["@cf/meta/llama-3-8b-instruct", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--prompt");
  });

  test("handles JSON response fallback", async () => {
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async () => {
        return { data: [1, 2, 3] };
      },
    });

    await aiRunRun(["@cf/some/model", "--prompt", "test", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("handles string response", async () => {
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async () => {
        return "raw text response";
      },
    });

    await aiRunRun(["@cf/some/model", "--prompt", "test", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.raws).toHaveLength(1);
    expect(output.captured.raws[0]).toBe("raw text response");
  });

  test("merges --options into request body", async () => {
    let capturedBody: unknown;
    const { ctx } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { response: "ok" };
      },
    });

    await aiRunRun([
      "@cf/meta/llama-3-8b-instruct",
      "--prompt", "test",
      "--options", '{"temperature":0.5}',
      "--account-id", ACCOUNT_ID,
    ], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["temperature"]).toBe(0.5);
  });

  test("throws on invalid --options JSON", async () => {
    const { ctx } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
    });

    expect(
      aiRunRun(["@cf/some/model", "--prompt", "test", "--options", "not json", "--account-id", ACCOUNT_ID], ctx),
    ).rejects.toThrow("Invalid JSON");
  });
});

// ─── AI Models List ───────────────────────────────────────────────────────

describe("ai models list", () => {
  test("lists models", async () => {
    const models = [sampleAIModel(), sampleAIModel({ id: "m2", name: "@cf/openai/whisper" })];
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return models;
      },
    });

    await modelsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("passes --task filter", async () => {
    let capturedParams: Record<string, string> = {};
    const { ctx } = aCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        if (params) capturedParams = params;
        return [];
      },
    });

    await modelsListRun(["--task", "Text Generation", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedParams["task"]).toBe("Text Generation");
  });

  test("passes --search filter", async () => {
    let capturedParams: Record<string, string> = {};
    const { ctx } = aCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        if (params) capturedParams = params;
        return [];
      },
    });

    await modelsListRun(["--search", "llama", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedParams["search"]).toBe("llama");
  });

  test("uses correct API path", async () => {
    let capturedPath = "";
    const { ctx } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await modelsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain("/ai/models/search");
  });
});

// ─── AI Models Get ────────────────────────────────────────────────────────

describe("ai models get", () => {
  test("gets a model by name", async () => {
    const model = sampleAIModel();
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [model];
      },
    });

    await modelsGetRun(["--model", "@cf/meta/llama-3-8b-instruct", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("@cf/meta/llama-3-8b-instruct");
  });

  test("throws when model not found", async () => {
    const { ctx } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });

    expect(
      modelsGetRun(["--model", "@cf/nonexistent/model", "--account-id", ACCOUNT_ID], ctx),
    ).rejects.toThrow("not found");
  });

  test("throws when --model is missing", async () => {
    const { ctx } = aCtx();
    expect(modelsGetRun([], ctx)).rejects.toThrow("--model");
  });
});

// ─── AI Fine-Tuning List ──────────────────────────────────────────────────

describe("ai fine-tuning list", () => {
  test("lists fine-tuning jobs", async () => {
    const jobs = [sampleFineTune(), sampleFineTune({ id: "ft-2", name: "other-ft" })];
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return jobs;
      },
    });

    await ftListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("uses correct API path", async () => {
    let capturedPath = "";
    const { ctx } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await ftListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain("/ai/finetunes");
  });
});

// ─── AI Fine-Tuning Get ──────────────────────────────────────────────────

describe("ai fine-tuning get", () => {
  test("gets a fine-tuning job", async () => {
    const job = sampleFineTune();
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return job;
      },
    });

    await ftGetRun(["--id", "ft-uuid-123", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Model"]).toBe("@cf/meta/llama-3-8b-instruct");
    expect(output.captured.details[0]!["Status"]).toBe("running");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = aCtx();
    expect(ftGetRun([], ctx)).rejects.toThrow("--id");
  });

  test("includes job ID in API path", async () => {
    let capturedPath = "";
    const { ctx } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return sampleFineTune();
      },
    });

    await ftGetRun(["--id", "ft-uuid-123", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain("ft-uuid-123");
  });
});

// ─── AI Fine-Tuning Delete ───────────────────────────────────────────────

describe("ai fine-tuning delete", () => {
  test("deletes a fine-tuning job with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await ftDeleteRun(["--id", "ft-uuid-123", "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain("ft-uuid-123");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = aCtx({}, { yes: undefined });

    await ftDeleteRun(["--id", "ft-uuid-123", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = aCtx();
    expect(ftDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Routers ──────────────────────────────────────────────────────────────

describe("ai router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await aiRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(aiRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown ai command");
  });

  test("routes fine-tuning with alias 'ft'", async () => {
    const { ctx, output } = createTestContext();
    await aiRouterRun(["ft"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes models with alias 'model'", async () => {
    const { ctx, output } = createTestContext();
    await aiRouterRun(["model"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("ai models router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await modelsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(modelsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown ai models command");
  });
});

describe("ai fine-tuning router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await ftRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(ftRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown ai fine-tuning command");
  });
});
