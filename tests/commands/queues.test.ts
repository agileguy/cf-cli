import { describe, test, expect } from "bun:test";
import {
  createTestContext,
  sampleQueue,
  sampleQueueConsumer,
} from "../helpers.js";

// Queues
import { run as listRun } from "../../src/commands/queues/list.js";
import { run as getRun } from "../../src/commands/queues/get.js";
import { run as createRun } from "../../src/commands/queues/create.js";
import { run as updateRun } from "../../src/commands/queues/update.js";
import { run as deleteRun } from "../../src/commands/queues/delete.js";
import { run as purgeRun } from "../../src/commands/queues/purge.js";
import { run as sendRun } from "../../src/commands/queues/send.js";

// Queue Consumers
import { run as consumersListRun } from "../../src/commands/queues/consumers/list.js";
import { run as consumersAddRun } from "../../src/commands/queues/consumers/add.js";
import { run as consumersDeleteRun } from "../../src/commands/queues/consumers/delete.js";

// Routers
import { run as queuesRouterRun } from "../../src/commands/queues/index.js";
import { run as consumersRouterRun } from "../../src/commands/queues/consumers/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const QUEUE_ID = "queue-uuid-123";

function qCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── Queues List ──────────────────────────────────────────────────────────

describe("queues list", () => {
  test("lists queues", async () => {
    const queues = [sampleQueue(), sampleQueue({ queue_id: "q-2", queue_name: "other-queue" })];
    const { ctx, output } = qCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return queues;
      },
    });

    await listRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = qCtx({
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

// ─── Queues Get ───────────────────────────────────────────────────────────

describe("queues get", () => {
  test("gets a queue by name", async () => {
    const queue = sampleQueue();
    const { ctx, output } = qCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return queue;
      },
    });

    await getRun(["--queue", "my-queue", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-queue");
  });

  test("throws when --queue is missing", async () => {
    const { ctx } = qCtx();
    expect(getRun([], ctx)).rejects.toThrow("--queue");
  });
});

// ─── Queues Create ────────────────────────────────────────────────────────

describe("queues create", () => {
  test("creates a queue", async () => {
    const queue = sampleQueue();
    let capturedBody: unknown;
    const { ctx, output } = qCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return queue;
      },
    });

    await createRun(["--name", "my-queue", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("my-queue");
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["queue_name"]).toBe("my-queue");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = qCtx();
    expect(createRun([], ctx)).rejects.toThrow("--name");
  });
});

// ─── Queues Update ────────────────────────────────────────────────────────

describe("queues update", () => {
  test("updates a queue name", async () => {
    const queue = sampleQueue({ queue_name: "new-name" });
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = qCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return queue;
      },
    });

    await updateRun(["--queue", QUEUE_ID, "--name", "new-name", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("new-name");
    expect(capturedPath).toContain(QUEUE_ID);
    const body = capturedBody as Record<string, unknown>;
    expect(body["queue_name"]).toBe("new-name");
  });

  test("throws when --queue is missing", async () => {
    const { ctx } = qCtx();
    expect(updateRun(["--name", "x"], ctx)).rejects.toThrow("--queue");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = qCtx();
    expect(updateRun(["--queue", QUEUE_ID], ctx)).rejects.toThrow("--name");
  });
});

// ─── Queues Delete ────────────────────────────────────────────────────────

describe("queues delete", () => {
  test("deletes a queue with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = qCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await deleteRun(["--queue", QUEUE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(QUEUE_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = qCtx({}, { yes: undefined });

    await deleteRun(["--queue", QUEUE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --queue is missing", async () => {
    const { ctx } = qCtx();
    expect(deleteRun([], ctx)).rejects.toThrow("--queue");
  });
});

// ─── Queues Purge ─────────────────────────────────────────────────────────

describe("queues purge", () => {
  test("purges a queue with --yes", async () => {
    let postedPath = "";
    const { ctx, output } = qCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (path: string) => {
        postedPath = path;
        return {};
      },
    });

    await purgeRun(["--queue", QUEUE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(postedPath).toContain(QUEUE_ID);
    expect(postedPath).toContain("/purge");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("purged");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = qCtx({}, { yes: undefined });

    await purgeRun(["--queue", QUEUE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --queue is missing", async () => {
    const { ctx } = qCtx();
    expect(purgeRun([], ctx)).rejects.toThrow("--queue");
  });
});

// ─── Queue Messages Send ──────────────────────────────────────────────────

describe("queues messages send", () => {
  test("sends a message to a queue", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = qCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return { message_id: "msg-uuid-123" };
      },
    });

    await sendRun(["--queue", QUEUE_ID, "--body", "hello world", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain(QUEUE_ID);
    expect(capturedPath).toContain("/messages");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("sent");
    const body = capturedBody as Record<string, unknown>;
    expect(body["body"]).toBe("hello world");
  });

  test("sends a message with delay", async () => {
    let capturedBody: unknown;
    const { ctx } = qCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { message_id: "msg-uuid-456" };
      },
    });

    await sendRun(["--queue", QUEUE_ID, "--body", "delayed", "--delay", "30", "--account-id", ACCOUNT_ID], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["delay_seconds"]).toBe(30);
  });

  test("throws when --queue is missing", async () => {
    const { ctx } = qCtx();
    expect(sendRun(["--body", "hello"], ctx)).rejects.toThrow("--queue");
  });

  test("throws when --body is missing", async () => {
    const { ctx } = qCtx();
    expect(sendRun(["--queue", QUEUE_ID], ctx)).rejects.toThrow("--body");
  });
});

// ─── Queue Consumers List ─────────────────────────────────────────────────

describe("queues consumers list", () => {
  test("lists consumers for a queue", async () => {
    const consumers = [sampleQueueConsumer(), sampleQueueConsumer({ service: "worker-2" })];
    const { ctx, output } = qCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return consumers;
      },
    });

    await consumersListRun(["--queue", QUEUE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --queue is missing", async () => {
    const { ctx } = qCtx();
    expect(consumersListRun([], ctx)).rejects.toThrow("--queue");
  });
});

// ─── Queue Consumers Add ──────────────────────────────────────────────────

describe("queues consumers add", () => {
  test("adds a consumer to a queue", async () => {
    const consumer = sampleQueueConsumer();
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = qCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return consumer;
      },
    });

    await consumersAddRun([
      "--queue", QUEUE_ID,
      "--script", "my-consumer-worker",
      "--batch-size", "10",
      "--max-retries", "3",
      "--dead-letter", "dlq-name",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedPath).toContain(QUEUE_ID);
    expect(capturedPath).toContain("/consumers");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("added");
    const body = capturedBody as Record<string, unknown>;
    expect(body["script_name"]).toBe("my-consumer-worker");
    expect(body["dead_letter_queue"]).toBe("dlq-name");
    const settings = body["settings"] as Record<string, unknown>;
    expect(settings["batch_size"]).toBe(10);
    expect(settings["max_retries"]).toBe(3);
  });

  test("throws when --queue is missing", async () => {
    const { ctx } = qCtx();
    expect(consumersAddRun(["--script", "x"], ctx)).rejects.toThrow("--queue");
  });

  test("throws when --script is missing", async () => {
    const { ctx } = qCtx();
    expect(consumersAddRun(["--queue", QUEUE_ID], ctx)).rejects.toThrow("--script");
  });
});

// ─── Queue Consumers Delete ───────────────────────────────────────────────

describe("queues consumers delete", () => {
  test("deletes a consumer with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = qCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await consumersDeleteRun([
      "--queue", QUEUE_ID,
      "--consumer", "my-consumer-worker",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(deletedPath).toContain(QUEUE_ID);
    expect(deletedPath).toContain("/consumers/");
    expect(deletedPath).toContain("my-consumer-worker");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("removed");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = qCtx({}, { yes: undefined });

    await consumersDeleteRun([
      "--queue", QUEUE_ID,
      "--consumer", "my-consumer-worker",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --queue is missing", async () => {
    const { ctx } = qCtx();
    expect(consumersDeleteRun(["--consumer", "x"], ctx)).rejects.toThrow("--queue");
  });

  test("throws when --consumer is missing", async () => {
    const { ctx } = qCtx();
    expect(consumersDeleteRun(["--queue", QUEUE_ID], ctx)).rejects.toThrow("--consumer");
  });
});

// ─── Routers ──────────────────────────────────────────────────────────────

describe("queues router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await queuesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(queuesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown queues command");
  });

  test("routes to list with alias 'ls'", async () => {
    const { ctx, output } = qCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await queuesRouterRun(["ls", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });
});

describe("queues consumers router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await consumersRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(consumersRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown queues consumers command");
  });
});
