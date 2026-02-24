import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Sites commands
import { run as sitesListRun } from "../../src/commands/web-analytics/sites/list.js";
import { run as sitesGetRun } from "../../src/commands/web-analytics/sites/get.js";
import { run as sitesCreateRun } from "../../src/commands/web-analytics/sites/create.js";
import { run as sitesUpdateRun } from "../../src/commands/web-analytics/sites/update.js";
import { run as sitesDeleteRun } from "../../src/commands/web-analytics/sites/delete.js";

// Rules commands
import { run as rulesListRun } from "../../src/commands/web-analytics/rules/list.js";
import { run as rulesCreateRun } from "../../src/commands/web-analytics/rules/create.js";
import { run as rulesDeleteRun } from "../../src/commands/web-analytics/rules/delete.js";

// Routers
import { run as mainRouterRun } from "../../src/commands/web-analytics/index.js";
import { run as sitesRouterRun } from "../../src/commands/web-analytics/sites/index.js";
import { run as rulesRouterRun } from "../../src/commands/web-analytics/rules/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const SITE_TAG = "site-tag-abc123";

function sampleSite(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    site_tag: SITE_TAG,
    site_token: "token-xyz",
    auto_install: true,
    host: "example.com",
    created: "2024-06-01T12:00:00.000Z",
    snippet: '<script src="https://..."></script>',
    ...overrides,
  };
}

function sampleRule(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "rule-uuid-123",
    host: "example.com",
    paths: ["/api/*"],
    inclusive: true,
    is_paused: false,
    created: "2024-06-01T12:00:00.000Z",
    priority: 1,
    ...overrides,
  };
}

function waCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── Sites List ────────────────────────────────────────────────────────

describe("web-analytics sites list", () => {
  test("lists sites", async () => {
    const sites = [sampleSite(), sampleSite({ site_tag: "site-2", host: "other.com" })];
    const { ctx, output } = waCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return sites;
      },
    });

    await sitesListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = waCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await sitesListRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
    expect(capturedPath).toContain("rum/site_info/list");
  });

  test("handles empty list", async () => {
    const { ctx, output } = waCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });

    await sitesListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(0);
  });
});

// ─── Sites Get ─────────────────────────────────────────────────────────

describe("web-analytics sites get", () => {
  test("gets a site by ID", async () => {
    const site = sampleSite();
    const { ctx, output } = waCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return site;
      },
    });

    await sitesGetRun(["--id", SITE_TAG, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Site Tag"]).toBe(SITE_TAG);
    expect(output.captured.details[0]!["Host"]).toBe("example.com");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = waCtx();
    expect(sitesGetRun([], ctx)).rejects.toThrow("--id");
  });

  test("encodes site ID in URL path", async () => {
    let capturedPath = "";
    const { ctx } = waCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return sampleSite();
      },
    });

    await sitesGetRun(["--id", "site/with/slashes", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain("site%2Fwith%2Fslashes");
  });
});

// ─── Sites Create ──────────────────────────────────────────────────────

describe("web-analytics sites create", () => {
  test("creates a site", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const site = sampleSite();
    const { ctx, output } = waCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return site;
      },
    });

    await sitesCreateRun(["--host", "example.com", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain("rum/site_info");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["host"]).toBe("example.com");
  });

  test("throws when --host is missing", async () => {
    const { ctx } = waCtx();
    expect(sitesCreateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--host");
  });

  test("sets auto_install to true by default", async () => {
    let capturedBody: unknown;
    const { ctx } = waCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleSite();
      },
    });

    await sitesCreateRun(["--host", "example.com", "--account-id", ACCOUNT_ID], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["auto_install"]).toBe(true);
  });
});

// ─── Sites Update ──────────────────────────────────────────────────────

describe("web-analytics sites update", () => {
  test("updates a site host", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = waCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return sampleSite({ host: "new.example.com" });
      },
    });

    await sitesUpdateRun(["--id", SITE_TAG, "--host", "new.example.com", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain(SITE_TAG);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("updated");
    const body = capturedBody as Record<string, unknown>;
    expect(body["host"]).toBe("new.example.com");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = waCtx();
    expect(sitesUpdateRun(["--host", "x"], ctx)).rejects.toThrow("--id");
  });
});

// ─── Sites Delete ──────────────────────────────────────────────────────

describe("web-analytics sites delete", () => {
  test("deletes a site with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = waCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await sitesDeleteRun(["--id", SITE_TAG, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(SITE_TAG);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = waCtx({}, { yes: undefined });

    await sitesDeleteRun(["--id", SITE_TAG, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = waCtx();
    expect(sitesDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Rules List ────────────────────────────────────────────────────────

describe("web-analytics rules list", () => {
  test("lists rules for a site", async () => {
    const rules = [sampleRule(), sampleRule({ id: "rule-2", host: "api.example.com" })];
    const { ctx, output } = waCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return rules;
      },
    });

    await rulesListRun(["--site", SITE_TAG, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --site is missing", async () => {
    const { ctx } = waCtx();
    expect(rulesListRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--site");
  });

  test("encodes site ID in URL", async () => {
    let capturedPath = "";
    const { ctx } = waCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await rulesListRun(["--site", SITE_TAG, "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain(`/rum/v2/${SITE_TAG}/rules`);
  });
});

// ─── Rules Create ──────────────────────────────────────────────────────

describe("web-analytics rules create", () => {
  test("throws when --site is missing", async () => {
    const { ctx } = waCtx();
    expect(rulesCreateRun(["--file", "rule.json"], ctx)).rejects.toThrow("--site");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = waCtx();
    expect(rulesCreateRun(["--site", SITE_TAG], ctx)).rejects.toThrow("--file");
  });

  test("throws on unreadable file", async () => {
    const { ctx } = waCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async () => sampleRule(),
    });
    expect(rulesCreateRun(["--site", SITE_TAG, "--file", "/nonexistent/rule.json", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Rules Delete ──────────────────────────────────────────────────────

describe("web-analytics rules delete", () => {
  test("deletes a rule with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = waCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await rulesDeleteRun(["--site", SITE_TAG, "--id", "rule-123", "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(SITE_TAG);
    expect(deletedPath).toContain("rule-123");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = waCtx({}, { yes: undefined });

    await rulesDeleteRun(["--site", SITE_TAG, "--id", "rule-123", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --site is missing", async () => {
    const { ctx } = waCtx();
    expect(rulesDeleteRun(["--id", "rule-123"], ctx)).rejects.toThrow("--site");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = waCtx();
    expect(rulesDeleteRun(["--site", SITE_TAG], ctx)).rejects.toThrow("--id");
  });
});

// ─── Routers ───────────────────────────────────────────────────────────

describe("web-analytics main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown web-analytics command");
  });

  test("routes 'sites' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["sites"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'rules' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["rules"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'site' alias", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["site"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("web-analytics sites router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await sitesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown action", async () => {
    const { ctx } = createTestContext();
    expect(sitesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown web-analytics sites action");
  });
});

describe("web-analytics rules router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await rulesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown action", async () => {
    const { ctx } = createTestContext();
    expect(rulesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown web-analytics rules action");
  });
});
