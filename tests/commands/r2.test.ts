import { describe, test, expect } from "bun:test";
import {
  createTestContext,
  sampleR2Bucket,
  sampleR2CorsRule,
  sampleR2LifecycleRule,
  sampleR2CustomDomain,
  sampleR2EventNotificationConfig,
  sampleR2Metrics,
} from "../helpers.js";

// R2 Buckets
import { run as bucketsListRun } from "../../src/commands/r2/buckets/list.js";
import { run as bucketsGetRun } from "../../src/commands/r2/buckets/get.js";
import { run as bucketsCreateRun } from "../../src/commands/r2/buckets/create.js";
import { run as bucketsUpdateRun } from "../../src/commands/r2/buckets/update.js";
import { run as bucketsDeleteRun } from "../../src/commands/r2/buckets/delete.js";
import { run as bucketsRouterRun } from "../../src/commands/r2/buckets/index.js";

// R2 CORS
import { run as corsListRun } from "../../src/commands/r2/cors/list.js";
import { run as corsSetRun } from "../../src/commands/r2/cors/set.js";
import { run as corsDeleteRun } from "../../src/commands/r2/cors/delete.js";
import { run as corsRouterRun } from "../../src/commands/r2/cors/index.js";

// R2 Lifecycle
import { run as lifecycleGetRun } from "../../src/commands/r2/lifecycle/get.js";
import { run as lifecycleSetRun } from "../../src/commands/r2/lifecycle/set.js";
import { run as lifecycleDeleteRun } from "../../src/commands/r2/lifecycle/delete.js";
import { run as lifecycleRouterRun } from "../../src/commands/r2/lifecycle/index.js";

// R2 Custom Domains
import { run as cdListRun } from "../../src/commands/r2/custom-domains/list.js";
import { run as cdAddRun } from "../../src/commands/r2/custom-domains/add.js";
import { run as cdRemoveRun } from "../../src/commands/r2/custom-domains/remove.js";
import { run as cdRouterRun } from "../../src/commands/r2/custom-domains/index.js";

// R2 Event Notifications
import { run as enListRun } from "../../src/commands/r2/event-notifications/list.js";
import { run as enCreateRun } from "../../src/commands/r2/event-notifications/create.js";
import { run as enDeleteRun } from "../../src/commands/r2/event-notifications/delete.js";
import { run as enRouterRun } from "../../src/commands/r2/event-notifications/index.js";

// R2 Metrics
import { run as metricsRun } from "../../src/commands/r2/metrics/index.js";

// R2 Main Router
import { run as r2RouterRun } from "../../src/commands/r2/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const BUCKET_NAME = "my-bucket";

/** Helper: create a test context with auto-resolving account ID */
function r2Ctx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── R2 Buckets ─────────────────────────────────────────────────────────

describe("r2 buckets list", () => {
  test("lists R2 buckets", async () => {
    const buckets = [sampleR2Bucket(), sampleR2Bucket({ name: "other-bucket" })];
    const { ctx, output } = r2Ctx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return buckets;
      },
    });

    await bucketsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("passes cursor param", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = r2Ctx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedParams = params;
        return [];
      },
    });

    await bucketsListRun(["--cursor", "abc123", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedParams).toBeDefined();
    expect(capturedParams!["cursor"]).toBe("abc123");
  });
});

describe("r2 buckets get", () => {
  test("gets a bucket by name", async () => {
    const bucket = sampleR2Bucket();
    const { ctx, output } = r2Ctx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return bucket;
      },
    });

    await bucketsGetRun(["--name", BUCKET_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-bucket");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = r2Ctx();
    expect(bucketsGetRun([], ctx)).rejects.toThrow("--name");
  });
});

describe("r2 buckets create", () => {
  test("creates a bucket", async () => {
    const bucket = sampleR2Bucket();
    let capturedBody: unknown;
    const { ctx, output } = r2Ctx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return bucket;
      },
    });

    await bucketsCreateRun(["--name", "my-bucket", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("my-bucket");
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("my-bucket");
  });

  test("passes location and storage-class", async () => {
    let capturedBody: unknown;
    const { ctx } = r2Ctx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleR2Bucket();
      },
    });

    await bucketsCreateRun(["--name", "my-bucket", "--location", "ENAM", "--storage-class", "InfrequentAccess", "--account-id", ACCOUNT_ID], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["locationHint"]).toBe("ENAM");
    expect(body["storageClass"]).toBe("InfrequentAccess");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = r2Ctx();
    expect(bucketsCreateRun([], ctx)).rejects.toThrow("--name");
  });
});

describe("r2 buckets update", () => {
  test("updates a bucket", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = r2Ctx({
      patch: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return {};
      },
    });

    await bucketsUpdateRun(["--name", BUCKET_NAME, "--default-storage-class", "InfrequentAccess", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(capturedPath).toContain(BUCKET_NAME);
    const body = capturedBody as Record<string, unknown>;
    expect(body["storageClass"]).toBe("InfrequentAccess");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = r2Ctx();
    expect(bucketsUpdateRun(["--default-storage-class", "X"], ctx)).rejects.toThrow("--name");
  });

  test("throws when no update flag provided", async () => {
    const { ctx } = r2Ctx();
    expect(bucketsUpdateRun(["--name", "bucket", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("at least one update flag");
  });
});

describe("r2 buckets delete", () => {
  test("deletes a bucket with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = r2Ctx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await bucketsDeleteRun(["--name", BUCKET_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(BUCKET_NAME);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = r2Ctx({}, { yes: undefined });

    await bucketsDeleteRun(["--name", BUCKET_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = r2Ctx();
    expect(bucketsDeleteRun([], ctx)).rejects.toThrow("--name");
  });
});

describe("r2 buckets router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await bucketsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(bucketsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown r2 buckets command");
  });
});

// ─── R2 CORS ────────────────────────────────────────────────────────────

describe("r2 cors list", () => {
  test("lists CORS rules", async () => {
    const rules = [sampleR2CorsRule()];
    const { ctx, output } = r2Ctx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return rules;
      },
    });

    await corsListRun(["--bucket", BUCKET_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });

  test("throws when --bucket is missing", async () => {
    const { ctx } = r2Ctx();
    expect(corsListRun([], ctx)).rejects.toThrow("--bucket");
  });
});

describe("r2 cors set", () => {
  test("sets CORS rules from file", async () => {
    const tmpFile = `/tmp/cf-cli-test-cors-${Date.now()}.json`;
    await Bun.write(tmpFile, JSON.stringify([{ allowed_origins: ["*"], allowed_methods: ["GET"] }]));

    let capturedPath = "";
    let capturedBody: unknown;
    const { ctx, output } = r2Ctx({
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return {};
      },
    });

    await corsSetRun(["--bucket", BUCKET_NAME, "--file", tmpFile, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("CORS");
    expect(capturedPath).toContain(BUCKET_NAME);
    expect(capturedBody).toEqual([{ allowed_origins: ["*"], allowed_methods: ["GET"] }]);

    const { unlinkSync } = await import("fs");
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  });

  test("throws when --bucket is missing", async () => {
    const { ctx } = r2Ctx();
    expect(corsSetRun(["--file", "f.json"], ctx)).rejects.toThrow("--bucket");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = r2Ctx();
    expect(corsSetRun(["--bucket", "b"], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = r2Ctx();
    expect(corsSetRun(["--bucket", "b", "--file", "/tmp/nonexistent-cf-test.json", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("Could not read file");
  });

  test("throws when file has invalid JSON", async () => {
    const tmpFile = `/tmp/cf-cli-test-cors-bad-${Date.now()}.json`;
    await Bun.write(tmpFile, "not json {{{");
    const { ctx } = r2Ctx();
    expect(corsSetRun(["--bucket", "b", "--file", tmpFile, "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("valid JSON");
    const { unlinkSync } = await import("fs");
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  });
});

describe("r2 cors delete", () => {
  test("deletes CORS rules with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = r2Ctx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await corsDeleteRun(["--bucket", BUCKET_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(BUCKET_NAME);
    expect(deletedPath).toContain("/cors");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = r2Ctx({}, { yes: undefined });
    await corsDeleteRun(["--bucket", BUCKET_NAME, "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

describe("r2 cors router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await corsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(corsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown r2 cors command");
  });
});

// ─── R2 Lifecycle ───────────────────────────────────────────────────────

describe("r2 lifecycle get", () => {
  test("lists lifecycle rules", async () => {
    const rules = [sampleR2LifecycleRule()];
    const { ctx, output } = r2Ctx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return rules;
      },
    });

    await lifecycleGetRun(["--bucket", BUCKET_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });

  test("throws when --bucket is missing", async () => {
    const { ctx } = r2Ctx();
    expect(lifecycleGetRun([], ctx)).rejects.toThrow("--bucket");
  });
});

describe("r2 lifecycle set", () => {
  test("sets lifecycle rules from file", async () => {
    const tmpFile = `/tmp/cf-cli-test-lifecycle-${Date.now()}.json`;
    await Bun.write(tmpFile, JSON.stringify([{ id: "rule-1", enabled: true, action: { type: "Delete" } }]));

    let capturedPath = "";
    const { ctx, output } = r2Ctx({
      put: async (path: string) => {
        capturedPath = path;
        return {};
      },
    });

    await lifecycleSetRun(["--bucket", BUCKET_NAME, "--file", tmpFile, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(capturedPath).toContain("/lifecycle");

    const { unlinkSync } = await import("fs");
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  });

  test("throws when --bucket is missing", async () => {
    const { ctx } = r2Ctx();
    expect(lifecycleSetRun(["--file", "f.json"], ctx)).rejects.toThrow("--bucket");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = r2Ctx();
    expect(lifecycleSetRun(["--bucket", "b"], ctx)).rejects.toThrow("--file");
  });
});

describe("r2 lifecycle delete", () => {
  test("deletes lifecycle rules with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = r2Ctx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await lifecycleDeleteRun(["--bucket", BUCKET_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain("/lifecycle");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = r2Ctx({}, { yes: undefined });
    await lifecycleDeleteRun(["--bucket", BUCKET_NAME, "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

describe("r2 lifecycle router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await lifecycleRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(lifecycleRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown r2 lifecycle command");
  });
});

// ─── R2 Custom Domains ─────────────────────────────────────────────────

describe("r2 custom-domains list", () => {
  test("lists custom domains", async () => {
    const domains = [sampleR2CustomDomain()];
    const { ctx, output } = r2Ctx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return domains;
      },
    });

    await cdListRun(["--bucket", BUCKET_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });

  test("throws when --bucket is missing", async () => {
    const { ctx } = r2Ctx();
    expect(cdListRun([], ctx)).rejects.toThrow("--bucket");
  });
});

describe("r2 custom-domains add", () => {
  test("adds a custom domain", async () => {
    const domain = sampleR2CustomDomain();
    let capturedBody: unknown;
    const { ctx, output } = r2Ctx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return domain;
      },
    });

    await cdAddRun(["--bucket", BUCKET_NAME, "--domain", "cdn.example.com", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("cdn.example.com");
    const body = capturedBody as Record<string, unknown>;
    expect(body["domain"]).toBe("cdn.example.com");
  });

  test("passes zone-id when provided", async () => {
    let capturedBody: unknown;
    const { ctx } = r2Ctx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleR2CustomDomain();
      },
    });

    await cdAddRun(["--bucket", BUCKET_NAME, "--domain", "cdn.example.com", "--zone-id", "zone-123", "--account-id", ACCOUNT_ID], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["zoneId"]).toBe("zone-123");
  });

  test("throws when --bucket is missing", async () => {
    const { ctx } = r2Ctx();
    expect(cdAddRun(["--domain", "d"], ctx)).rejects.toThrow("--bucket");
  });

  test("throws when --domain is missing", async () => {
    const { ctx } = r2Ctx();
    expect(cdAddRun(["--bucket", "b"], ctx)).rejects.toThrow("--domain");
  });
});

describe("r2 custom-domains remove", () => {
  test("removes a custom domain with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = r2Ctx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await cdRemoveRun(["--bucket", BUCKET_NAME, "--domain", "cdn.example.com", "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain("cdn.example.com");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = r2Ctx({}, { yes: undefined });
    await cdRemoveRun(["--bucket", BUCKET_NAME, "--domain", "cdn.example.com", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

describe("r2 custom-domains router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await cdRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(cdRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown r2 custom-domains command");
  });
});

// ─── R2 Event Notifications ────────────────────────────────────────────

describe("r2 event-notifications list", () => {
  test("lists event notification rules", async () => {
    const config = sampleR2EventNotificationConfig();
    const { ctx, output } = r2Ctx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return config;
      },
    });

    await enListRun(["--bucket", BUCKET_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });

  test("throws when --bucket is missing", async () => {
    const { ctx } = r2Ctx();
    expect(enListRun([], ctx)).rejects.toThrow("--bucket");
  });
});

describe("r2 event-notifications create", () => {
  test("creates an event notification rule", async () => {
    let capturedPath = "";
    let capturedBody: unknown;
    const { ctx, output } = r2Ctx({
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return {};
      },
    });

    await enCreateRun([
      "--bucket", BUCKET_NAME,
      "--queue", "queue-uuid-123",
      "--event-types", "object-create,object-delete",
      "--prefix", "uploads/",
      "--suffix", ".jpg",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(capturedPath).toContain("queue-uuid-123");
    const body = capturedBody as Record<string, unknown>;
    const rules = body["rules"] as Record<string, unknown>[];
    expect(rules[0]!["actions"]).toEqual(["object-create", "object-delete"]);
    expect(rules[0]!["prefix"]).toBe("uploads/");
    expect(rules[0]!["suffix"]).toBe(".jpg");
  });

  test("throws when --bucket is missing", async () => {
    const { ctx } = r2Ctx();
    expect(enCreateRun(["--queue", "q", "--event-types", "x"], ctx)).rejects.toThrow("--bucket");
  });

  test("throws when --queue is missing", async () => {
    const { ctx } = r2Ctx();
    expect(enCreateRun(["--bucket", "b", "--event-types", "x"], ctx)).rejects.toThrow("--queue");
  });

  test("throws when --event-types is missing", async () => {
    const { ctx } = r2Ctx();
    expect(enCreateRun(["--bucket", "b", "--queue", "q"], ctx)).rejects.toThrow("--event-types");
  });
});

describe("r2 event-notifications delete", () => {
  test("deletes a rule with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = r2Ctx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await enDeleteRun(["--bucket", BUCKET_NAME, "--queue", "queue-uuid-123", "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain("queue-uuid-123");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = r2Ctx({}, { yes: undefined });
    await enDeleteRun(["--bucket", BUCKET_NAME, "--queue", "q-1", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --bucket is missing", async () => {
    const { ctx } = r2Ctx();
    expect(enDeleteRun(["--queue", "q"], ctx)).rejects.toThrow("--bucket");
  });

  test("throws when --queue is missing", async () => {
    const { ctx } = r2Ctx();
    expect(enDeleteRun(["--bucket", "b"], ctx)).rejects.toThrow("--queue");
  });
});

describe("r2 event-notifications router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await enRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(enRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown r2 event-notifications command");
  });
});

// ─── R2 Metrics ─────────────────────────────────────────────────────────

describe("r2 metrics", () => {
  test("shows bucket metrics", async () => {
    const metrics = sampleR2Metrics();
    const { ctx, output } = r2Ctx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return metrics;
      },
    });

    await metricsRun(["--bucket", BUCKET_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Bucket"]).toBe(BUCKET_NAME);
    expect(output.captured.details[0]!["Object Count"]).toBe(1500);
  });

  test("passes date range params", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = r2Ctx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedParams = params;
        return sampleR2Metrics();
      },
    });

    await metricsRun(["--bucket", BUCKET_NAME, "--from", "2024-01-01", "--to", "2024-01-31", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedParams!["start"]).toBe("2024-01-01");
    expect(capturedParams!["end"]).toBe("2024-01-31");
  });

  test("throws when --bucket is missing", async () => {
    const { ctx } = r2Ctx();
    expect(metricsRun([], ctx)).rejects.toThrow("--bucket");
  });
});

// ─── R2 Main Router ────────────────────────────────────────────────────

describe("r2 router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await r2RouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(r2RouterRun(["unknown"], ctx)).rejects.toThrow("Unknown r2 command");
  });

  test("routes to buckets subcommand", async () => {
    const { ctx, output } = r2Ctx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await r2RouterRun(["buckets", "list", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'bucket' alias to buckets", async () => {
    const { ctx, output } = createTestContext();
    await r2RouterRun(["bucket"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});
