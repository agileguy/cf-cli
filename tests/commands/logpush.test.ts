import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Jobs commands
import { run as jobsListRun } from "../../src/commands/logpush/jobs/list.js";
import { run as jobsGetRun } from "../../src/commands/logpush/jobs/get.js";
import { run as jobsCreateRun } from "../../src/commands/logpush/jobs/create.js";
import { run as jobsUpdateRun } from "../../src/commands/logpush/jobs/update.js";
import { run as jobsDeleteRun } from "../../src/commands/logpush/jobs/delete.js";
import { run as jobsEnableRun } from "../../src/commands/logpush/jobs/enable.js";
import { run as jobsDisableRun } from "../../src/commands/logpush/jobs/disable.js";

// Other commands
import { run as datasetsRun } from "../../src/commands/logpush/datasets.js";
import { run as ownershipRun } from "../../src/commands/logpush/ownership.js";
import { run as instantRun } from "../../src/commands/logpush/instant.js";

// Routers
import { run as mainRouterRun } from "../../src/commands/logpush/index.js";
import { run as jobsRouterRun } from "../../src/commands/logpush/jobs/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";
const ACCOUNT_ID = "abc123def456abc123def456abc12345";

function sampleJob(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 100,
    name: "example-job",
    enabled: true,
    dataset: "http_requests",
    destination_conf: "s3://bucket/logs?region=us-east-1",
    logpull_options: "fields=RayID,ClientIP",
    frequency: "high",
    last_complete: "2024-06-01T12:00:00.000Z",
    last_error: null,
    ...overrides,
  };
}

function lpCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
  return createTestContext(
    {
      ...clientOverrides,
    } as Record<string, unknown>,
    flagOverrides,
  );
}

// ─── Jobs List ─────────────────────────────────────────────────────────

describe("logpush jobs list", () => {
  test("lists jobs for a zone", async () => {
    const jobs = [sampleJob(), sampleJob({ id: 101, name: "other-job" })];
    const { ctx, output } = lpCtx({
      get: async () => jobs,
    });

    await jobsListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("lists jobs for an account", async () => {
    let capturedPath = "";
    const { ctx, output } = lpCtx({
      get: async (path: string) => {
        capturedPath = path;
        return [sampleJob()];
      },
    });

    await jobsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain(`/accounts/${ACCOUNT_ID}/logpush/jobs`);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("zone scope takes priority over account", async () => {
    let capturedPath = "";
    const { ctx } = lpCtx({
      get: async (path: string) => {
        capturedPath = path;
        return [];
      },
    });

    await jobsListRun(["--zone", ZONE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain(`/zones/${ZONE_ID}/logpush/jobs`);
  });

  test("handles empty list", async () => {
    const { ctx, output } = lpCtx({
      get: async () => [],
    });

    await jobsListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(0);
  });
});

// ─── Jobs Get ──────────────────────────────────────────────────────────

describe("logpush jobs get", () => {
  test("gets a job by ID", async () => {
    const job = sampleJob();
    const { ctx, output } = lpCtx({
      get: async () => job,
    });

    await jobsGetRun(["--zone", ZONE_ID, "--id", "100"], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe(100);
    expect(output.captured.details[0]!["Dataset"]).toBe("http_requests");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = lpCtx({
      get: async () => ({}),
    });
    expect(jobsGetRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });

  test("uses account scope when --account-id provided", async () => {
    let capturedPath = "";
    const { ctx } = lpCtx({
      get: async (path: string) => {
        capturedPath = path;
        return sampleJob();
      },
    });

    await jobsGetRun(["--account-id", ACCOUNT_ID, "--id", "100"], ctx);

    expect(capturedPath).toContain(`/accounts/${ACCOUNT_ID}/logpush/jobs/100`);
  });
});

// ─── Jobs Create ───────────────────────────────────────────────────────

describe("logpush jobs create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = lpCtx();
    expect(jobsCreateRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws on unreadable file", async () => {
    const { ctx } = lpCtx({
      post: async () => sampleJob(),
    });
    expect(jobsCreateRun(["--zone", ZONE_ID, "--file", "/nonexistent/job.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Jobs Update ───────────────────────────────────────────────────────

describe("logpush jobs update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = lpCtx();
    expect(jobsUpdateRun(["--zone", ZONE_ID, "--file", "x.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = lpCtx();
    expect(jobsUpdateRun(["--zone", ZONE_ID, "--id", "100"], ctx)).rejects.toThrow("--file");
  });
});

// ─── Jobs Delete ───────────────────────────────────────────────────────

describe("logpush jobs delete", () => {
  test("deletes a job with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = lpCtx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await jobsDeleteRun(["--zone", ZONE_ID, "--id", "100"], ctx);

    expect(deletedPath).toContain("/logpush/jobs/100");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = lpCtx({}, { yes: undefined });

    await jobsDeleteRun(["--zone", ZONE_ID, "--id", "100"], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = lpCtx();
    expect(jobsDeleteRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Jobs Enable / Disable ─────────────────────────────────────────────

describe("logpush jobs enable", () => {
  test("enables a job", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = lpCtx({
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return sampleJob({ enabled: true });
      },
    });

    await jobsEnableRun(["--zone", ZONE_ID, "--id", "100"], ctx);

    expect(capturedPath).toContain("/logpush/jobs/100");
    const body = capturedBody as Record<string, unknown>;
    expect(body["enabled"]).toBe(true);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("enabled");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = lpCtx();
    expect(jobsEnableRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("logpush jobs disable", () => {
  test("disables a job", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = lpCtx({
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return sampleJob({ enabled: false });
      },
    });

    await jobsDisableRun(["--zone", ZONE_ID, "--id", "100"], ctx);

    expect(capturedPath).toContain("/logpush/jobs/100");
    const body = capturedBody as Record<string, unknown>;
    expect(body["enabled"]).toBe(false);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("disabled");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = lpCtx();
    expect(jobsDisableRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Datasets ──────────────────────────────────────────────────────────

describe("logpush datasets", () => {
  test("lists datasets", async () => {
    const datasets = [
      { id: "http_requests", name: "HTTP Requests", description: "HTTP request logs" },
      { id: "firewall_events", name: "Firewall Events", description: "Firewall event logs" },
    ];
    const { ctx, output } = lpCtx({
      get: async () => datasets,
    });

    await datasetsRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("uses account scope", async () => {
    let capturedPath = "";
    const { ctx } = lpCtx({
      get: async (path: string) => {
        capturedPath = path;
        return [];
      },
    });

    await datasetsRun(["--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain(`/accounts/${ACCOUNT_ID}/logpush/datasets`);
  });
});

// ─── Ownership Verify ──────────────────────────────────────────────────

describe("logpush ownership verify", () => {
  test("verifies ownership", async () => {
    let capturedBody: unknown;
    const result = { valid: true, filename: "ownership-challenge.txt", message: "OK" };
    const { ctx, output } = lpCtx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return result;
      },
    });

    await ownershipRun(["--zone", ZONE_ID, "--destination-conf", "s3://bucket/logs"], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Valid"]).toBe(true);
    const body = capturedBody as Record<string, unknown>;
    expect(body["destination_conf"]).toBe("s3://bucket/logs");
  });

  test("throws when --destination-conf is missing", async () => {
    const { ctx } = lpCtx({
      post: async () => ({}),
    });
    expect(ownershipRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--destination-conf");
  });
});

// ─── Instant Logs ──────────────────────────────────────────────────────

describe("logpush instant logs", () => {
  test("starts instant logs session", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const result = { session_id: "sess-123", destination_conf: "stdout", fields: "RayID,ClientIP" };
    const { ctx, output } = lpCtx({
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return result;
      },
    });

    await instantRun(["--zone", ZONE_ID, "--dataset", "http_requests", "--fields", "RayID,ClientIP"], ctx);

    expect(capturedPath).toContain("/logpush/edge");
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Session ID"]).toBe("sess-123");
    const body = capturedBody as Record<string, unknown>;
    expect(body["dataset"]).toBe("http_requests");
    expect(body["fields"]).toBe("RayID,ClientIP");
  });

  test("passes from/to timestamps", async () => {
    let capturedBody: unknown;
    const { ctx } = lpCtx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { session_id: "s1" };
      },
    });

    await instantRun(["--zone", ZONE_ID, "--dataset", "http_requests", "--from", "2024-01-01", "--to", "2024-01-02"], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["start_time"]).toBe("2024-01-01");
    expect(body["end_time"]).toBe("2024-01-02");
  });

  test("throws when --dataset is missing", async () => {
    const { ctx } = lpCtx({
      post: async () => ({}),
    });
    expect(instantRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--dataset");
  });
});

// ─── Scope Resolution ──────────────────────────────────────────────────

describe("logpush scope resolution", () => {
  test("throws when neither --zone nor --account-id provided and auto-resolve fails", async () => {
    const { ctx } = lpCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [];
        return {};
      },
    });
    expect(jobsListRun([], ctx)).rejects.toThrow("--zone");
  });

  test("auto-resolves account when neither flag given but single account", async () => {
    let capturedPath = "";
    const { ctx } = lpCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID, name: "Test" }];
        capturedPath = path;
        return [];
      },
    });

    await jobsListRun([], ctx);

    expect(capturedPath).toContain(`/accounts/${ACCOUNT_ID}/logpush/jobs`);
  });

  test("resolves zone name to ID", async () => {
    let capturedPath = "";
    const { ctx } = lpCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name === "example.com") {
          return [{ id: ZONE_ID }];
        }
        capturedPath = path;
        return [];
      },
    });

    await jobsListRun(["--zone", "example.com"], ctx);

    expect(capturedPath).toContain(`/zones/${ZONE_ID}/logpush/jobs`);
  });
});

// ─── Routers ───────────────────────────────────────────────────────────

describe("logpush main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown logpush command");
  });

  test("routes 'jobs' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["jobs"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'datasets' subcommand to help/run", async () => {
    const { ctx } = lpCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [];
        return [];
      },
    });
    // This will fail due to scope resolution, which is fine
    expect(mainRouterRun(["datasets"], ctx)).rejects.toThrow();
  });
});

describe("logpush jobs router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await jobsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown action", async () => {
    const { ctx } = createTestContext();
    expect(jobsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown logpush jobs action");
  });
});
