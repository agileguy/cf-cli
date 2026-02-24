import { describe, test, expect } from "bun:test";
import {
  createTestContext,
  sampleWorkerScript,
  sampleWorkerRoute,
  sampleWorkerCronSchedule,
  sampleWorkerDomain,
  sampleWorkerVersion,
  sampleWorkerNamespace,
  sampleWorkerNamespaceScript,
  sampleWorkerTail,
} from "../helpers.js";

// Workers Scripts
import { run as listRun } from "../../src/commands/workers/list.js";
import { run as getRun } from "../../src/commands/workers/get.js";
import { run as deployRun } from "../../src/commands/workers/deploy.js";
import { run as deleteRun } from "../../src/commands/workers/delete.js";
import { run as routerRun } from "../../src/commands/workers/index.js";

// Workers Routes
import { run as routesListRun } from "../../src/commands/workers/routes/list.js";
import { run as routesGetRun } from "../../src/commands/workers/routes/get.js";
import { run as routesCreateRun } from "../../src/commands/workers/routes/create.js";
import { run as routesUpdateRun } from "../../src/commands/workers/routes/update.js";
import { run as routesDeleteRun } from "../../src/commands/workers/routes/delete.js";
import { run as routesRouterRun } from "../../src/commands/workers/routes/index.js";

// Workers Cron
import { run as cronGetRun } from "../../src/commands/workers/cron/get.js";
import { run as cronUpdateRun } from "../../src/commands/workers/cron/update.js";
import { run as cronRouterRun } from "../../src/commands/workers/cron/index.js";

// Workers Domains
import { run as domainsListRun } from "../../src/commands/workers/domains/list.js";
import { run as domainsGetRun } from "../../src/commands/workers/domains/get.js";
import { run as domainsCreateRun } from "../../src/commands/workers/domains/create.js";
import { run as domainsDeleteRun } from "../../src/commands/workers/domains/delete.js";
import { run as domainsRouterRun } from "../../src/commands/workers/domains/index.js";

// Workers Versions
import { run as versionsListRun } from "../../src/commands/workers/versions/list.js";
import { run as versionsGetRun } from "../../src/commands/workers/versions/get.js";
import { run as versionsRouterRun } from "../../src/commands/workers/versions/index.js";

// Workers Platforms
import { run as platformsRouterRun } from "../../src/commands/workers/platforms/index.js";
import { run as nsListRun } from "../../src/commands/workers/platforms/namespaces-list.js";
import { run as nsGetRun } from "../../src/commands/workers/platforms/namespaces-get.js";
import { run as nsScriptsListRun } from "../../src/commands/workers/platforms/scripts-list.js";
import { run as nsScriptsDeleteRun } from "../../src/commands/workers/platforms/scripts-delete.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";

/** Helper: create a test context where --account-id auto-resolves to our test account */
function workersCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
  const originalGet = clientOverrides.get as ((path: string, params?: Record<string, string>) => Promise<unknown>) | undefined;
  return createTestContext(
    {
      ...clientOverrides,
      get: async (path: string, params?: Record<string, string>) => {
        // Auto-resolve account ID
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

// ─── Workers Scripts ────────────────────────────────────────────────────────

describe("workers list", () => {
  test("lists worker scripts", async () => {
    const scripts = [sampleWorkerScript(), sampleWorkerScript({ id: "worker-2" })];
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return scripts;
      },
    });

    await listRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = workersCtx({
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

describe("workers get", () => {
  test("gets a worker script by name", async () => {
    const script = sampleWorkerScript();
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return script;
      },
    });

    await getRun(["--name", "my-worker", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-worker");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = workersCtx();
    expect(getRun([], ctx)).rejects.toThrow("--name");
  });
});

describe("workers deploy", () => {
  test("throws when --name is missing", async () => {
    const { ctx } = workersCtx();
    expect(deployRun(["worker.js"], ctx)).rejects.toThrow("--name");
  });

  test("throws when file argument is missing", async () => {
    const { ctx } = workersCtx();
    expect(deployRun(["--name", "my-worker"], ctx)).rejects.toThrow("file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = workersCtx();
    expect(
      deployRun(["nonexistent-file.js", "--name", "my-worker", "--account-id", ACCOUNT_ID], ctx),
    ).rejects.toThrow("Cannot read file");
  });

  test("deploys a worker script from file", async () => {
    // Write a temp file to deploy
    const tmpFile = `/tmp/cf-cli-test-worker-${Date.now()}.js`;
    await Bun.write(tmpFile, 'export default { fetch() { return new Response("OK"); } }');

    let capturedPath = "";
    const script = sampleWorkerScript();
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      uploadPut: async (path: string) => {
        capturedPath = path;
        return script;
      },
    });

    await deployRun([tmpFile, "--name", "my-worker", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain("my-worker");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deployed");

    // Cleanup
    const { unlinkSync } = await import("fs");
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  });
});

describe("workers delete", () => {
  test("deletes a worker with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await deleteRun(["--name", "my-worker", "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain("my-worker");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = workersCtx({}, { yes: undefined });

    await deleteRun(["--name", "my-worker", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = workersCtx();
    expect(deleteRun([], ctx)).rejects.toThrow("--name");
  });
});

// ─── Workers Routes ─────────────────────────────────────────────────────────

describe("workers routes list", () => {
  test("lists routes for a zone", async () => {
    const routes = [sampleWorkerRoute(), sampleWorkerRoute({ id: "route456" })];
    const { ctx, output } = createTestContext({
      get: async () => routes,
    });

    await routesListRun(["--zone", "023e105f4ecef8ad9ca31a8372d0c353"], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(routesListRun([], ctx)).rejects.toThrow("--zone");
  });
});

describe("workers routes get", () => {
  test("gets a route by ID", async () => {
    const route = sampleWorkerRoute();
    const { ctx, output } = createTestContext({
      get: async () => route,
    });

    await routesGetRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--id", "route123abc",
    ], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Pattern"]).toBe("example.com/*");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(routesGetRun(["--id", "abc"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(routesGetRun(["--zone", "023e105f4ecef8ad9ca31a8372d0c353"], ctx)).rejects.toThrow("--id");
  });
});

describe("workers routes create", () => {
  test("creates a route", async () => {
    const route = sampleWorkerRoute();
    let capturedBody: unknown;
    const { ctx, output } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return route;
      },
    });

    await routesCreateRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--pattern", "example.com/*",
      "--script", "my-worker",
    ], ctx);

    expect(output.captured.successes).toHaveLength(1);
    const body = capturedBody as Record<string, unknown>;
    expect(body["pattern"]).toBe("example.com/*");
    expect(body["script"]).toBe("my-worker");
  });

  test("throws when --pattern is missing", async () => {
    const { ctx } = createTestContext();
    expect(routesCreateRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--script", "my-worker",
    ], ctx)).rejects.toThrow("--pattern");
  });

  test("throws when --script is missing", async () => {
    const { ctx } = createTestContext();
    expect(routesCreateRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--pattern", "example.com/*",
    ], ctx)).rejects.toThrow("--script");
  });
});

describe("workers routes update", () => {
  test("updates a route", async () => {
    let capturedBody: unknown;
    const { ctx, output } = createTestContext({
      put: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleWorkerRoute({ pattern: "example.com/api/*" });
      },
    });

    await routesUpdateRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--id", "route123abc",
      "--pattern", "example.com/api/*",
      "--script", "api-worker",
    ], ctx);

    expect(output.captured.successes).toHaveLength(1);
    const body = capturedBody as Record<string, unknown>;
    expect(body["pattern"]).toBe("example.com/api/*");
    expect(body["script"]).toBe("api-worker");
  });

  test("throws when --pattern is missing", async () => {
    const { ctx } = createTestContext();
    expect(routesUpdateRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--id", "route123abc",
    ], ctx)).rejects.toThrow("--pattern");
  });
});

describe("workers routes delete", () => {
  test("deletes a route with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return { id: "route123abc" };
      },
    });

    await routesDeleteRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--id", "route123abc",
    ], ctx);

    expect(deletedPath).toContain("route123abc");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await routesDeleteRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--id", "route123abc",
    ], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

describe("workers routes router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown workers routes command");
  });
});

// ─── Workers Cron ───────────────────────────────────────────────────────────

describe("workers cron get", () => {
  test("gets cron triggers for a worker", async () => {
    const schedule = sampleWorkerCronSchedule();
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return schedule;
      },
    });

    await cronGetRun(["--name", "my-worker", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });

  test("throws when --name is missing", async () => {
    const { ctx } = workersCtx();
    expect(cronGetRun([], ctx)).rejects.toThrow("--name");
  });
});

describe("workers cron update", () => {
  test("updates cron triggers", async () => {
    let capturedBody: unknown;
    const schedule = sampleWorkerCronSchedule();
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      put: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return schedule;
      },
    });

    await cronUpdateRun([
      "--name", "my-worker",
      "--crons", "*/5 * * * *,0 0 * * *",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.successes).toHaveLength(1);
    const body = capturedBody as { cron: string }[];
    expect(body).toHaveLength(2);
    expect(body[0]!.cron).toBe("*/5 * * * *");
    expect(body[1]!.cron).toBe("0 0 * * *");
  });

  test("throws when --crons is missing", async () => {
    const { ctx } = workersCtx();
    expect(cronUpdateRun(["--name", "my-worker"], ctx)).rejects.toThrow("--crons");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = workersCtx();
    expect(cronUpdateRun(["--crons", "*/5 * * * *"], ctx)).rejects.toThrow("--name");
  });
});

describe("workers cron router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await cronRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(cronRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown workers cron command");
  });
});

// ─── Workers Domains ────────────────────────────────────────────────────────

describe("workers domains list", () => {
  test("lists worker domains", async () => {
    const domains = [sampleWorkerDomain(), sampleWorkerDomain({ id: "domain456" })];
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return domains;
      },
    });

    await domainsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("workers domains get", () => {
  test("gets a domain by ID", async () => {
    const domain = sampleWorkerDomain();
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return domain;
      },
    });

    await domainsGetRun(["--id", "domain123", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Hostname"]).toBe("api.example.com");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = workersCtx();
    expect(domainsGetRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("workers domains create", () => {
  test("creates a worker domain", async () => {
    const domain = sampleWorkerDomain();
    let capturedBody: unknown;
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return domain;
      },
    });

    await domainsCreateRun([
      "--hostname", "api.example.com",
      "--zone-id", "023e105f4ecef8ad9ca31a8372d0c353",
      "--service", "my-worker",
      "--environment", "production",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.successes).toHaveLength(1);
    const body = capturedBody as Record<string, unknown>;
    expect(body["hostname"]).toBe("api.example.com");
    expect(body["service"]).toBe("my-worker");
  });

  test("throws when required fields are missing", async () => {
    const { ctx } = workersCtx();
    expect(domainsCreateRun(["--hostname", "api.example.com"], ctx)).rejects.toThrow("--zone-id");
  });
});

describe("workers domains delete", () => {
  test("deletes a domain with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await domainsDeleteRun(["--id", "domain123", "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain("domain123");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = workersCtx({}, { yes: undefined });

    await domainsDeleteRun(["--id", "domain123", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

describe("workers domains router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await domainsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(domainsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown workers domains command");
  });
});

// ─── Workers Versions ───────────────────────────────────────────────────────

describe("workers versions list", () => {
  test("lists versions for a worker", async () => {
    const versions = [sampleWorkerVersion(), sampleWorkerVersion({ id: "v2", number: 2 })];
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return versions;
      },
    });

    await versionsListRun(["--name", "my-worker", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --name is missing", async () => {
    const { ctx } = workersCtx();
    expect(versionsListRun([], ctx)).rejects.toThrow("--name");
  });
});

describe("workers versions get", () => {
  test("gets a specific version", async () => {
    const version = sampleWorkerVersion();
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return version;
      },
    });

    await versionsGetRun([
      "--name", "my-worker",
      "--id", "version-uuid-123",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Version ID"]).toBe("version-uuid-123");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = workersCtx();
    expect(versionsGetRun(["--id", "v1"], ctx)).rejects.toThrow("--name");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = workersCtx();
    expect(versionsGetRun(["--name", "my-worker"], ctx)).rejects.toThrow("--id");
  });
});

describe("workers versions router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await versionsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(versionsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown workers versions command");
  });
});

// ─── Workers for Platforms ──────────────────────────────────────────────────

describe("workers platforms namespaces list", () => {
  test("lists dispatch namespaces", async () => {
    const namespaces = [sampleWorkerNamespace(), sampleWorkerNamespace({ namespace_id: "ns-2" })];
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return namespaces;
      },
    });

    await nsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("workers platforms namespaces get", () => {
  test("gets a namespace by ID", async () => {
    const ns = sampleWorkerNamespace();
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return ns;
      },
    });

    await nsGetRun(["--id", "ns-uuid-123", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-namespace");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = workersCtx();
    expect(nsGetRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("workers platforms scripts list", () => {
  test("lists scripts in a namespace", async () => {
    const scripts = [sampleWorkerNamespaceScript(), sampleWorkerNamespaceScript({ id: "s2" })];
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return scripts;
      },
    });

    await nsScriptsListRun(["--namespace", "my-namespace", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --namespace is missing", async () => {
    const { ctx } = workersCtx();
    expect(nsScriptsListRun([], ctx)).rejects.toThrow("--namespace");
  });
});

describe("workers platforms scripts delete", () => {
  test("deletes a namespace script with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await nsScriptsDeleteRun([
      "--namespace", "my-namespace",
      "--name", "my-script",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(deletedPath).toContain("my-namespace");
    expect(deletedPath).toContain("my-script");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = workersCtx({}, { yes: undefined });

    await nsScriptsDeleteRun([
      "--namespace", "my-namespace",
      "--name", "my-script",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

describe("workers platforms router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await platformsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subresource", async () => {
    const { ctx } = createTestContext();
    expect(platformsRouterRun(["unknown", "list"], ctx)).rejects.toThrow("Unknown platforms subresource");
  });

  test("throws on unknown namespaces subcommand", async () => {
    const { ctx } = createTestContext();
    expect(platformsRouterRun(["namespaces", "unknown"], ctx)).rejects.toThrow("Unknown platforms namespaces command");
  });

  test("throws on unknown scripts subcommand", async () => {
    const { ctx } = createTestContext();
    expect(platformsRouterRun(["scripts", "unknown"], ctx)).rejects.toThrow("Unknown platforms scripts command");
  });
});

// ─── Workers Main Router ────────────────────────────────────────────────────

describe("workers router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown workers command");
  });

  test("routes to list", async () => {
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await routerRun(["list", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to routes subcommand", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["routes", "list", "--zone", "023e105f4ecef8ad9ca31a8372d0c353"], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes with aliases", async () => {
    const { ctx, output } = workersCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await routerRun(["ls", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });
});
