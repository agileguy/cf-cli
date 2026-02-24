import { describe, test, expect } from "bun:test";
import {
  createTestContext,
  sampleAPIGatewaySettings,
  sampleAPIGatewaySchema,
} from "../helpers.js";

// Settings commands
import { run as settingsGetRun } from "../../src/commands/api-gateway/settings/get.js";
import { run as settingsUpdateRun } from "../../src/commands/api-gateway/settings/update.js";

// Schemas commands
import { run as schemasListRun } from "../../src/commands/api-gateway/schemas/list.js";
import { run as schemasGetRun } from "../../src/commands/api-gateway/schemas/get.js";
import { run as schemasDeleteRun } from "../../src/commands/api-gateway/schemas/delete.js";

// Routers
import { run as mainRouterRun } from "../../src/commands/api-gateway/index.js";
import { run as settingsRouterRun } from "../../src/commands/api-gateway/settings/index.js";
import { run as schemasRouterRun } from "../../src/commands/api-gateway/schemas/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";

function agCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
  const originalGet = clientOverrides.get as ((path: string, params?: Record<string, string>) => Promise<unknown>) | undefined;
  return createTestContext(
    {
      ...clientOverrides,
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) {
          return [{ id: ZONE_ID, name: params.name }];
        }
        if (originalGet) return originalGet(path, params);
        return {};
      },
    } as Record<string, unknown>,
    flagOverrides,
  );
}

// ─── Settings Get ────────────────────────────────────────────────────────

describe("api-gateway settings get", () => {
  test("gets settings for a zone", async () => {
    const settings = sampleAPIGatewaySettings();
    const { ctx, output } = agCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return settings;
      },
    });

    await settingsGetRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["API Gateway Enabled"]).toBe(true);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = agCtx();
    expect(settingsGetRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Settings Update ─────────────────────────────────────────────────────

describe("api-gateway settings update", () => {
  test("enables API Gateway", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = agCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return {};
      },
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return {};
      },
    });

    await settingsUpdateRun(["--zone", ZONE_ID, "--enabled"], ctx);

    expect(capturedPath).toContain("api_gateway/settings");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("enabled");
    const body = capturedBody as Record<string, unknown>;
    expect(body["enabled"]).toBe(true);
  });

  test("disables API Gateway with --no-enabled", async () => {
    let capturedBody: unknown;
    const { ctx, output } = agCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return {};
      },
      put: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return {};
      },
    });

    await settingsUpdateRun(["--zone", ZONE_ID, "--no-enabled"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("disabled");
    const body = capturedBody as Record<string, unknown>;
    expect(body["enabled"]).toBe(false);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = agCtx();
    expect(settingsUpdateRun(["--enabled"], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Schemas List ────────────────────────────────────────────────────────

describe("api-gateway schemas list", () => {
  test("lists schemas", async () => {
    const schemas = [
      sampleAPIGatewaySchema(),
      sampleAPIGatewaySchema({ schema_id: "schema-2", name: "other-schema" }),
    ];
    const { ctx, output } = agCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return schemas;
      },
    });

    await schemasListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = agCtx();
    expect(schemasListRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Schemas Get ─────────────────────────────────────────────────────────

describe("api-gateway schemas get", () => {
  test("gets a schema by ID", async () => {
    const schema = sampleAPIGatewaySchema();
    const { ctx, output } = agCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return schema;
      },
    });

    await schemasGetRun(["--zone", ZONE_ID, "--id", "schema-uuid-123"], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-api-schema");
    expect(output.captured.details[0]!["Kind"]).toBe("openapi_v3");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = agCtx();
    expect(schemasGetRun(["--id", "x"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = agCtx();
    expect(schemasGetRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Schemas Delete ──────────────────────────────────────────────────────

describe("api-gateway schemas delete", () => {
  test("deletes a schema with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = agCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await schemasDeleteRun(["--zone", ZONE_ID, "--id", "schema-uuid-123"], ctx);

    expect(deletedPath).toContain("schema-uuid-123");
    expect(deletedPath).toContain("user_schemas");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = agCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones" && params?.name) return [{ id: ZONE_ID }];
        return {};
      },
    }, { yes: undefined });

    await schemasDeleteRun(["--zone", ZONE_ID, "--id", "schema-uuid-123"], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = agCtx();
    expect(schemasDeleteRun(["--id", "x"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = agCtx();
    expect(schemasDeleteRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Routers ─────────────────────────────────────────────────────────────

describe("api-gateway main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown api-gateway command");
  });

  test("routes 'settings' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["settings"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'schemas' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["schemas"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'setting' alias", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["setting"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'schema' alias", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["schema"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("api-gateway settings router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await settingsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(settingsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown api-gateway settings command");
  });
});

describe("api-gateway schemas router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await schemasRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(schemasRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown api-gateway schemas command");
  });
});
