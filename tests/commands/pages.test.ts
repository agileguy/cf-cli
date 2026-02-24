import { describe, test, expect } from "bun:test";
import {
  createTestContext,
  samplePagesProject,
  samplePagesDeployment,
  samplePagesDomain,
} from "../helpers.js";

// Pages Projects
import { run as pagesListRun } from "../../src/commands/pages/list.js";
import { run as pagesGetRun } from "../../src/commands/pages/get.js";
import { run as pagesCreateRun } from "../../src/commands/pages/create.js";
import { run as pagesUpdateRun } from "../../src/commands/pages/update.js";
import { run as pagesDeleteRun } from "../../src/commands/pages/delete.js";

// Pages Deployments
import { run as deploymentsListRun } from "../../src/commands/pages/deployments/list.js";
import { run as deploymentsGetRun } from "../../src/commands/pages/deployments/get.js";
import { run as deploymentsDeleteRun } from "../../src/commands/pages/deployments/delete.js";
import { run as deploymentsRetryRun } from "../../src/commands/pages/deployments/retry.js";
import { run as deploymentsRollbackRun } from "../../src/commands/pages/deployments/rollback.js";
import { run as deploymentsRouterRun } from "../../src/commands/pages/deployments/index.js";

// Pages Domains
import { run as domainsListRun } from "../../src/commands/pages/domains/list.js";
import { run as domainsAddRun } from "../../src/commands/pages/domains/add.js";
import { run as domainsGetRun } from "../../src/commands/pages/domains/get.js";
import { run as domainsDeleteRun } from "../../src/commands/pages/domains/delete.js";
import { run as domainsRouterRun } from "../../src/commands/pages/domains/index.js";

// Pages Router
import { run as pagesRouterRun } from "../../src/commands/pages/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const PROJECT_NAME = "my-site";
const DEPLOY_ID = "deploy-uuid-123";

/** Helper: create a test context with auto-resolving account ID */
function pagesCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── Pages Projects ─────────────────────────────────────────────────────

describe("pages list", () => {
  test("lists Pages projects", async () => {
    const projects = [samplePagesProject(), samplePagesProject({ name: "other-site" })];
    const { ctx, output } = pagesCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return projects;
      },
    });

    await pagesListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = pagesCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await pagesListRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
  });
});

describe("pages get", () => {
  test("gets a project by name", async () => {
    const project = samplePagesProject();
    const { ctx, output } = pagesCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return project;
      },
    });

    await pagesGetRun(["--project", PROJECT_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-site");
    expect(output.captured.details[0]!["Subdomain"]).toBe("my-site.pages.dev");
  });

  test("throws when --project is missing", async () => {
    const { ctx } = pagesCtx();
    expect(pagesGetRun([], ctx)).rejects.toThrow("--project");
  });
});

describe("pages create", () => {
  test("creates a project", async () => {
    const project = samplePagesProject();
    let capturedBody: unknown;
    const { ctx, output } = pagesCtx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return project;
      },
    });

    await pagesCreateRun(["--name", "my-site", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("my-site");
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("my-site");
  });

  test("passes production branch", async () => {
    let capturedBody: unknown;
    const { ctx } = pagesCtx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return samplePagesProject();
      },
    });

    await pagesCreateRun(["--name", "my-site", "--production-branch", "develop", "--account-id", ACCOUNT_ID], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["production_branch"]).toBe("develop");
  });

  test("throws when --name is missing", async () => {
    const { ctx } = pagesCtx();
    expect(pagesCreateRun([], ctx)).rejects.toThrow("--name");
  });
});

describe("pages update", () => {
  test("updates a project", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = pagesCtx({
      patch: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return {};
      },
    });

    await pagesUpdateRun(["--project", PROJECT_NAME, "--production-branch", "staging", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(capturedPath).toContain(PROJECT_NAME);
    const body = capturedBody as Record<string, unknown>;
    expect(body["production_branch"]).toBe("staging");
  });

  test("throws when --project is missing", async () => {
    const { ctx } = pagesCtx();
    expect(pagesUpdateRun(["--production-branch", "x"], ctx)).rejects.toThrow("--project");
  });

  test("throws when no update flag provided", async () => {
    const { ctx } = pagesCtx();
    expect(pagesUpdateRun(["--project", "p", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("at least one update flag");
  });
});

describe("pages delete", () => {
  test("deletes a project with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = pagesCtx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await pagesDeleteRun(["--project", PROJECT_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(PROJECT_NAME);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = pagesCtx({}, { yes: undefined });

    await pagesDeleteRun(["--project", PROJECT_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --project is missing", async () => {
    const { ctx } = pagesCtx();
    expect(pagesDeleteRun([], ctx)).rejects.toThrow("--project");
  });
});

// ─── Pages Deployments ──────────────────────────────────────────────────

describe("pages deployments list", () => {
  test("lists deployments", async () => {
    const deployments = [samplePagesDeployment(), samplePagesDeployment({ id: "deploy-2", environment: "preview" })];
    const { ctx, output } = pagesCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return deployments;
      },
    });

    await deploymentsListRun(["--project", PROJECT_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("passes env filter", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = pagesCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedParams = params;
        return [];
      },
    });

    await deploymentsListRun(["--project", PROJECT_NAME, "--env", "production", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedParams!["env"]).toBe("production");
  });

  test("throws when --project is missing", async () => {
    const { ctx } = pagesCtx();
    expect(deploymentsListRun([], ctx)).rejects.toThrow("--project");
  });
});

describe("pages deployments get", () => {
  test("gets a deployment", async () => {
    const deployment = samplePagesDeployment();
    const { ctx, output } = pagesCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return deployment;
      },
    });

    await deploymentsGetRun(["--project", PROJECT_NAME, "--id", DEPLOY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe("deploy-uuid-123");
    expect(output.captured.details[0]!["Environment"]).toBe("production");
  });

  test("throws when --project is missing", async () => {
    const { ctx } = pagesCtx();
    expect(deploymentsGetRun(["--id", "x"], ctx)).rejects.toThrow("--project");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = pagesCtx();
    expect(deploymentsGetRun(["--project", "p"], ctx)).rejects.toThrow("--id");
  });
});

describe("pages deployments delete", () => {
  test("deletes a deployment with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = pagesCtx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await deploymentsDeleteRun(["--project", PROJECT_NAME, "--id", DEPLOY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(DEPLOY_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = pagesCtx({}, { yes: undefined });

    await deploymentsDeleteRun(["--project", PROJECT_NAME, "--id", DEPLOY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --project is missing", async () => {
    const { ctx } = pagesCtx();
    expect(deploymentsDeleteRun(["--id", "x"], ctx)).rejects.toThrow("--project");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = pagesCtx();
    expect(deploymentsDeleteRun(["--project", "p"], ctx)).rejects.toThrow("--id");
  });
});

describe("pages deployments retry", () => {
  test("retries a deployment", async () => {
    const deployment = samplePagesDeployment({ id: "new-deploy-123" });
    let capturedPath = "";
    const { ctx, output } = pagesCtx({
      post: async (path: string) => {
        capturedPath = path;
        return deployment;
      },
    });

    await deploymentsRetryRun(["--project", PROJECT_NAME, "--id", DEPLOY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain("/retry");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("retry");
  });

  test("throws when --project is missing", async () => {
    const { ctx } = pagesCtx();
    expect(deploymentsRetryRun(["--id", "x"], ctx)).rejects.toThrow("--project");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = pagesCtx();
    expect(deploymentsRetryRun(["--project", "p"], ctx)).rejects.toThrow("--id");
  });
});

describe("pages deployments rollback", () => {
  test("rolls back to a deployment", async () => {
    const deployment = samplePagesDeployment({ id: "rollback-deploy-123" });
    let capturedPath = "";
    const { ctx, output } = pagesCtx({
      post: async (path: string) => {
        capturedPath = path;
        return deployment;
      },
    });

    await deploymentsRollbackRun(["--project", PROJECT_NAME, "--id", DEPLOY_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain("/rollback");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("Rolled back");
  });

  test("throws when --project is missing", async () => {
    const { ctx } = pagesCtx();
    expect(deploymentsRollbackRun(["--id", "x"], ctx)).rejects.toThrow("--project");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = pagesCtx();
    expect(deploymentsRollbackRun(["--project", "p"], ctx)).rejects.toThrow("--id");
  });
});

describe("pages deployments router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await deploymentsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(deploymentsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown pages deployments command");
  });
});

// ─── Pages Domains ──────────────────────────────────────────────────────

describe("pages domains list", () => {
  test("lists custom domains", async () => {
    const domains = [samplePagesDomain()];
    const { ctx, output } = pagesCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return domains;
      },
    });

    await domainsListRun(["--project", PROJECT_NAME, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });

  test("throws when --project is missing", async () => {
    const { ctx } = pagesCtx();
    expect(domainsListRun([], ctx)).rejects.toThrow("--project");
  });
});

describe("pages domains add", () => {
  test("adds a custom domain", async () => {
    const domain = samplePagesDomain();
    let capturedBody: unknown;
    const { ctx, output } = pagesCtx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return domain;
      },
    });

    await domainsAddRun(["--project", PROJECT_NAME, "--domain", "www.example.com", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("www.example.com");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("www.example.com");
  });

  test("throws when --project is missing", async () => {
    const { ctx } = pagesCtx();
    expect(domainsAddRun(["--domain", "d"], ctx)).rejects.toThrow("--project");
  });

  test("throws when --domain is missing", async () => {
    const { ctx } = pagesCtx();
    expect(domainsAddRun(["--project", "p"], ctx)).rejects.toThrow("--domain");
  });
});

describe("pages domains get", () => {
  test("gets a domain", async () => {
    const domain = samplePagesDomain();
    const { ctx, output } = pagesCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return domain;
      },
    });

    await domainsGetRun(["--project", PROJECT_NAME, "--domain", "www.example.com", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Domain"]).toBe("www.example.com");
    expect(output.captured.details[0]!["Status"]).toBe("active");
  });

  test("throws when --project is missing", async () => {
    const { ctx } = pagesCtx();
    expect(domainsGetRun(["--domain", "d"], ctx)).rejects.toThrow("--project");
  });

  test("throws when --domain is missing", async () => {
    const { ctx } = pagesCtx();
    expect(domainsGetRun(["--project", "p"], ctx)).rejects.toThrow("--domain");
  });
});

describe("pages domains delete", () => {
  test("deletes a domain with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = pagesCtx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await domainsDeleteRun(["--project", PROJECT_NAME, "--domain", "www.example.com", "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain("www.example.com");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("removed");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = pagesCtx({}, { yes: undefined });
    await domainsDeleteRun(["--project", PROJECT_NAME, "--domain", "www.example.com", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --project is missing", async () => {
    const { ctx } = pagesCtx();
    expect(domainsDeleteRun(["--domain", "d"], ctx)).rejects.toThrow("--project");
  });

  test("throws when --domain is missing", async () => {
    const { ctx } = pagesCtx();
    expect(domainsDeleteRun(["--project", "p"], ctx)).rejects.toThrow("--domain");
  });
});

describe("pages domains router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await domainsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(domainsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown pages domains command");
  });
});

// ─── Pages Main Router ─────────────────────────────────────────────────

describe("pages router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await pagesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(pagesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown pages command");
  });

  test("routes to list", async () => {
    const { ctx, output } = pagesCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await pagesRouterRun(["list", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to deployments subcommand", async () => {
    const { ctx, output } = createTestContext();
    await pagesRouterRun(["deployments"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to domains subcommand", async () => {
    const { ctx, output } = createTestContext();
    await pagesRouterRun(["domains"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'deploys' alias to deployments", async () => {
    const { ctx, output } = createTestContext();
    await pagesRouterRun(["deploys"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});
