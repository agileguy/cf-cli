import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Tunnel commands
import { run as listRun } from "../../src/commands/tunnels/list.js";
import { run as getRun } from "../../src/commands/tunnels/get.js";
import { run as createRun } from "../../src/commands/tunnels/create.js";
import { run as updateRun } from "../../src/commands/tunnels/update.js";
import { run as deleteRun } from "../../src/commands/tunnels/delete.js";
import { run as tokenRun } from "../../src/commands/tunnels/token.js";

// Config commands
import { run as configGetRun } from "../../src/commands/tunnels/config/get.js";
import { run as configUpdateRun } from "../../src/commands/tunnels/config/update.js";

// Connections commands
import { run as connsListRun } from "../../src/commands/tunnels/connections/list.js";
import { run as connsDeleteRun } from "../../src/commands/tunnels/connections/delete.js";

// Routers
import { run as mainRouterRun } from "../../src/commands/tunnels/index.js";
import { run as configRouterRun } from "../../src/commands/tunnels/config/index.js";
import { run as connsRouterRun } from "../../src/commands/tunnels/connections/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const TUNNEL_ID = "tunnel-uuid-123";
const CONN_ID = "conn-uuid-456";

function sampleTunnel(overrides: Record<string, unknown> = {}) {
  return {
    id: TUNNEL_ID,
    name: "my-tunnel",
    status: "healthy",
    created_at: "2024-06-01T12:00:00.000Z",
    tun_type: "cfd_tunnel",
    remote_config: true,
    connections: [],
    ...overrides,
  };
}

function sampleConnection(overrides: Record<string, unknown> = {}) {
  return {
    id: CONN_ID,
    colo_name: "DFW",
    is_pending_reconnect: false,
    origin_ip: "10.0.0.1",
    opened_at: "2024-06-01T12:00:00.000Z",
    client_version: "2024.6.0",
    ...overrides,
  };
}

function tunnelCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── Tunnels List ─────────────────────────────────────────────────────────

describe("tunnels list", () => {
  test("lists tunnels", async () => {
    const tunnels = [sampleTunnel(), sampleTunnel({ id: "tunnel-2", name: "other-tunnel" })];
    const { ctx, output } = tunnelCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return tunnels;
      },
    });

    await listRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = tunnelCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await listRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
    expect(capturedPath).toContain("cfd_tunnel");
  });

  test("passes name filter", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = tunnelCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedParams = params;
        return [];
      },
    });

    await listRun(["--name", "my-*", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedParams).toBeDefined();
    expect(capturedParams!["name"]).toBe("my-*");
  });

  test("passes is-deleted filter", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = tunnelCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedParams = params;
        return [];
      },
    });

    await listRun(["--is-deleted", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedParams).toBeDefined();
    expect(capturedParams!["is_deleted"]).toBe("true");
  });
});

// ─── Tunnels Get ──────────────────────────────────────────────────────────

describe("tunnels get", () => {
  test("gets a tunnel by ID", async () => {
    const tunnel = sampleTunnel();
    const { ctx, output } = tunnelCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return tunnel;
      },
    });

    await getRun(["--id", TUNNEL_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-tunnel");
    expect(output.captured.details[0]!["Status"]).toBe("healthy");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = tunnelCtx();
    expect(getRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Tunnels Create ─────────────────────────────────────────────────────

describe("tunnels create", () => {
  test("creates a tunnel", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const tunnel = sampleTunnel();
    const { ctx, output } = tunnelCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return tunnel;
      },
    });

    await createRun(["--name", "my-tunnel", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain("cfd_tunnel");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("my-tunnel");
    expect(body["tunnel_secret"]).toBeDefined();
  });

  test("throws when --name is missing", async () => {
    const { ctx } = tunnelCtx();
    expect(createRun([], ctx)).rejects.toThrow("--name");
  });
});

// ─── Tunnels Update ─────────────────────────────────────────────────────

describe("tunnels update", () => {
  test("updates a tunnel name", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const tunnel = sampleTunnel({ name: "new-name" });
    const { ctx, output } = tunnelCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      patch: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return tunnel;
      },
    });

    await updateRun(["--id", TUNNEL_ID, "--name", "new-name", "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain(TUNNEL_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("updated");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("new-name");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = tunnelCtx();
    expect(updateRun(["--name", "x"], ctx)).rejects.toThrow("--id");
  });
});

// ─── Tunnels Delete ─────────────────────────────────────────────────────

describe("tunnels delete", () => {
  test("deletes a tunnel with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = tunnelCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await deleteRun(["--id", TUNNEL_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(TUNNEL_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = tunnelCtx({}, { yes: undefined });

    await deleteRun(["--id", TUNNEL_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = tunnelCtx();
    expect(deleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Tunnels Token ──────────────────────────────────────────────────────

describe("tunnels token", () => {
  test("gets tunnel token", async () => {
    const { ctx, output } = tunnelCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return "eyJhbGciOiJSUzI1NiJ9.test-token";
      },
    });

    await tokenRun(["--id", TUNNEL_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
    expect(String(output.captured.raws[0])).toContain("test-token");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = tunnelCtx();
    expect(tokenRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Tunnels Config Get ─────────────────────────────────────────────────

describe("tunnels config get", () => {
  test("gets tunnel configuration", async () => {
    const config = {
      config: {
        ingress: [{ hostname: "example.com", service: "http://localhost:8080" }],
        warp_routing: { enabled: true },
      },
    };
    const { ctx, output } = tunnelCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return config;
      },
    });

    await configGetRun(["--id", TUNNEL_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    const result = output.captured.jsons[0] as Record<string, unknown>;
    expect(result["config"]).toBeDefined();
  });

  test("throws when --id is missing", async () => {
    const { ctx } = tunnelCtx();
    expect(configGetRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Tunnels Config Update ──────────────────────────────────────────────

describe("tunnels config update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = tunnelCtx();
    expect(configUpdateRun(["--file", "test.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = tunnelCtx();
    expect(configUpdateRun(["--id", TUNNEL_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = tunnelCtx();
    expect(configUpdateRun([
      "--id", TUNNEL_ID,
      "--file", "/tmp/nonexistent-cf-cli-tunnel-config.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Tunnels Connections List ───────────────────────────────────────────

describe("tunnels connections list", () => {
  test("lists tunnel connections", async () => {
    const connections = [sampleConnection(), sampleConnection({ id: "conn-2", colo_name: "LAX" })];
    const { ctx, output } = tunnelCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return connections;
      },
    });

    await connsListRun(["--id", TUNNEL_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --id is missing", async () => {
    const { ctx } = tunnelCtx();
    expect(connsListRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Tunnels Connections Delete ─────────────────────────────────────────

describe("tunnels connections delete", () => {
  test("deletes a connection with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = tunnelCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await connsDeleteRun([
      "--id", TUNNEL_ID,
      "--connection-id", CONN_ID,
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(deletedPath).toContain(TUNNEL_ID);
    expect(deletedPath).toContain(CONN_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = tunnelCtx({}, { yes: undefined });

    await connsDeleteRun([
      "--id", TUNNEL_ID,
      "--connection-id", CONN_ID,
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = tunnelCtx();
    expect(connsDeleteRun(["--connection-id", CONN_ID], ctx)).rejects.toThrow("--id");
  });

  test("throws when --connection-id is missing", async () => {
    const { ctx } = tunnelCtx();
    expect(connsDeleteRun(["--id", TUNNEL_ID], ctx)).rejects.toThrow("--connection-id");
  });
});

// ─── Routers ────────────────────────────────────────────────────────────

describe("tunnels main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown tunnels command");
  });

  test("routes 'list' subcommand", async () => {
    const { ctx } = tunnelCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await mainRouterRun(["list", "--account-id", ACCOUNT_ID], ctx);
  });

  test("routes 'config' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["config"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'connections' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["connections"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("tunnels config router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await configRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(configRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown tunnels config command");
  });
});

describe("tunnels connections router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await connsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(connsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown tunnels connections command");
  });
});
