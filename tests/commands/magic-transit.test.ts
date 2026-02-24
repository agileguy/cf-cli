import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// GRE Tunnel commands
import { run as greListRun } from "../../src/commands/magic-transit/gre-tunnels/list.js";
import { run as greGetRun } from "../../src/commands/magic-transit/gre-tunnels/get.js";
import { run as greCreateRun } from "../../src/commands/magic-transit/gre-tunnels/create.js";
import { run as greUpdateRun } from "../../src/commands/magic-transit/gre-tunnels/update.js";
import { run as greDeleteRun } from "../../src/commands/magic-transit/gre-tunnels/delete.js";

// IPsec Tunnel commands
import { run as ipsecListRun } from "../../src/commands/magic-transit/ipsec-tunnels/list.js";
import { run as ipsecGetRun } from "../../src/commands/magic-transit/ipsec-tunnels/get.js";
import { run as ipsecCreateRun } from "../../src/commands/magic-transit/ipsec-tunnels/create.js";
import { run as ipsecUpdateRun } from "../../src/commands/magic-transit/ipsec-tunnels/update.js";
import { run as ipsecDeleteRun } from "../../src/commands/magic-transit/ipsec-tunnels/delete.js";
import { run as ipsecPskRun } from "../../src/commands/magic-transit/ipsec-tunnels/generate-psk.js";

// Sites commands
import { run as sitesListRun } from "../../src/commands/magic-transit/sites/list.js";
import { run as sitesGetRun } from "../../src/commands/magic-transit/sites/get.js";
import { run as sitesCreateRun } from "../../src/commands/magic-transit/sites/create.js";
import { run as sitesUpdateRun } from "../../src/commands/magic-transit/sites/update.js";
import { run as sitesDeleteRun } from "../../src/commands/magic-transit/sites/delete.js";
import { run as lansListRun } from "../../src/commands/magic-transit/sites/lans-list.js";
import { run as wansListRun } from "../../src/commands/magic-transit/sites/wans-list.js";

// Routes commands
import { run as routesListRun } from "../../src/commands/magic-transit/routes/list.js";
import { run as routesCreateRun } from "../../src/commands/magic-transit/routes/create.js";
import { run as routesUpdateRun } from "../../src/commands/magic-transit/routes/update.js";
import { run as routesDeleteRun } from "../../src/commands/magic-transit/routes/delete.js";

// ACLs commands
import { run as aclsListRun } from "../../src/commands/magic-transit/acls/list.js";
import { run as aclsCreateRun } from "../../src/commands/magic-transit/acls/create.js";
import { run as aclsUpdateRun } from "../../src/commands/magic-transit/acls/update.js";
import { run as aclsDeleteRun } from "../../src/commands/magic-transit/acls/delete.js";

// PCAPs commands
import { run as pcapsListRun } from "../../src/commands/magic-transit/pcaps/list.js";
import { run as pcapsGetRun } from "../../src/commands/magic-transit/pcaps/get.js";
import { run as pcapsCreateRun } from "../../src/commands/magic-transit/pcaps/create.js";
import { run as pcapsDownloadRun } from "../../src/commands/magic-transit/pcaps/download.js";

// Routers
import { run as mainRouterRun } from "../../src/commands/magic-transit/index.js";
import { run as greRouterRun } from "../../src/commands/magic-transit/gre-tunnels/index.js";
import { run as ipsecRouterRun } from "../../src/commands/magic-transit/ipsec-tunnels/index.js";
import { run as sitesRouterRun } from "../../src/commands/magic-transit/sites/index.js";
import { run as routesRouterRun } from "../../src/commands/magic-transit/routes/index.js";
import { run as aclsRouterRun } from "../../src/commands/magic-transit/acls/index.js";
import { run as pcapsRouterRun } from "../../src/commands/magic-transit/pcaps/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const TUNNEL_ID = "gre-tunnel-uuid-123";
const IPSEC_ID = "ipsec-tunnel-uuid-456";
const SITE_ID = "site-uuid-789";
const ROUTE_ID = "route-uuid-abc";
const ACL_ID = "acl-uuid-def";
const PCAP_ID = "pcap-uuid-ghi";

function sampleGRETunnel(overrides: Record<string, unknown> = {}) {
  return {
    id: TUNNEL_ID,
    name: "my-gre-tunnel",
    customer_gre_endpoint: "198.51.100.1",
    cloudflare_gre_endpoint: "162.159.44.1",
    interface_address: "10.0.0.1/31",
    description: "Primary GRE tunnel",
    ttl: 64,
    mtu: 1476,
    created_on: "2024-06-01T12:00:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleIPsecTunnel(overrides: Record<string, unknown> = {}) {
  return {
    id: IPSEC_ID,
    name: "my-ipsec-tunnel",
    customer_endpoint: "198.51.100.2",
    cloudflare_endpoint: "162.159.44.2",
    interface_address: "10.0.0.2/31",
    description: "Primary IPsec tunnel",
    allow_null_cipher: false,
    replay_protection: true,
    created_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleSite(overrides: Record<string, unknown> = {}) {
  return {
    id: SITE_ID,
    name: "my-site",
    description: "Branch office",
    connector_id: "conn-123",
    ha_mode: false,
    created_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleRoute(overrides: Record<string, unknown> = {}) {
  return {
    id: ROUTE_ID,
    prefix: "10.0.0.0/8",
    priority: 100,
    nexthop: "10.0.0.1",
    description: "Internal network route",
    created_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleACL(overrides: Record<string, unknown> = {}) {
  return {
    id: ACL_ID,
    name: "my-acl",
    description: "Allow traffic",
    forward_locally: true,
    created_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function samplePCAP(overrides: Record<string, unknown> = {}) {
  return {
    id: PCAP_ID,
    type: "simple",
    system: "magic-transit",
    status: "success",
    colo_name: "DFW",
    time_limit: 300,
    created_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function mtCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── GRE Tunnels List ────────────────────────────────────────────────────

describe("magic-transit gre-tunnels list", () => {
  test("lists GRE tunnels", async () => {
    const tunnels = [sampleGRETunnel(), sampleGRETunnel({ id: "gre-2", name: "other-tunnel" })];
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return { gre_tunnels: tunnels };
      },
    });

    await greListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return { gre_tunnels: [] };
      },
    });

    await greListRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
    expect(capturedPath).toContain("gre_tunnels");
  });
});

// ─── GRE Tunnels Get ─────────────────────────────────────────────────────

describe("magic-transit gre-tunnels get", () => {
  test("gets a GRE tunnel by ID", async () => {
    const tunnel = sampleGRETunnel();
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return { gre_tunnel: tunnel };
      },
    });

    await greGetRun(["--id", TUNNEL_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-gre-tunnel");
    expect(output.captured.details[0]!["Customer Endpoint"]).toBe("198.51.100.1");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(greGetRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── GRE Tunnels Create ──────────────────────────────────────────────────

describe("magic-transit gre-tunnels create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = mtCtx();
    expect(greCreateRun([], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = mtCtx();
    expect(greCreateRun([
      "--file", "/tmp/nonexistent-cf-cli-gre.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── GRE Tunnels Update ──────────────────────────────────────────────────

describe("magic-transit gre-tunnels update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(greUpdateRun(["--file", "test.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = mtCtx();
    expect(greUpdateRun(["--id", TUNNEL_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = mtCtx();
    expect(greUpdateRun([
      "--id", TUNNEL_ID,
      "--file", "/tmp/nonexistent-cf-cli-gre-update.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── GRE Tunnels Delete ──────────────────────────────────────────────────

describe("magic-transit gre-tunnels delete", () => {
  test("deletes a GRE tunnel with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await greDeleteRun(["--id", TUNNEL_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(TUNNEL_ID);
    expect(deletedPath).toContain("gre_tunnels");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = mtCtx({}, { yes: undefined });

    await greDeleteRun(["--id", TUNNEL_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(greDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── IPsec Tunnels List ──────────────────────────────────────────────────

describe("magic-transit ipsec-tunnels list", () => {
  test("lists IPsec tunnels", async () => {
    const tunnels = [sampleIPsecTunnel(), sampleIPsecTunnel({ id: "ipsec-2", name: "backup-tunnel" })];
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return { ipsec_tunnels: tunnels };
      },
    });

    await ipsecListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

// ─── IPsec Tunnels Get ───────────────────────────────────────────────────

describe("magic-transit ipsec-tunnels get", () => {
  test("gets an IPsec tunnel by ID", async () => {
    const tunnel = sampleIPsecTunnel();
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return { ipsec_tunnel: tunnel };
      },
    });

    await ipsecGetRun(["--id", IPSEC_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-ipsec-tunnel");
    expect(output.captured.details[0]!["Customer Endpoint"]).toBe("198.51.100.2");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(ipsecGetRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── IPsec Tunnels Create ────────────────────────────────────────────────

describe("magic-transit ipsec-tunnels create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = mtCtx();
    expect(ipsecCreateRun([], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = mtCtx();
    expect(ipsecCreateRun([
      "--file", "/tmp/nonexistent-cf-cli-ipsec.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── IPsec Tunnels Update ────────────────────────────────────────────────

describe("magic-transit ipsec-tunnels update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(ipsecUpdateRun(["--file", "test.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = mtCtx();
    expect(ipsecUpdateRun(["--id", IPSEC_ID], ctx)).rejects.toThrow("--file");
  });
});

// ─── IPsec Tunnels Delete ────────────────────────────────────────────────

describe("magic-transit ipsec-tunnels delete", () => {
  test("deletes an IPsec tunnel with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await ipsecDeleteRun(["--id", IPSEC_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(IPSEC_ID);
    expect(deletedPath).toContain("ipsec_tunnels");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = mtCtx({}, { yes: undefined });

    await ipsecDeleteRun(["--id", IPSEC_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(ipsecDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── IPsec Generate PSK ──────────────────────────────────────────────────

describe("magic-transit ipsec-tunnels generate-psk", () => {
  test("generates a PSK", async () => {
    const pskResult = {
      psk: "supersecretpsk123",
      psk_metadata: { last_generated_on: "2024-06-01T12:00:00.000Z" },
    };
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async () => pskResult,
    });

    await ipsecPskRun(["--id", IPSEC_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("Pre-shared key generated");
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["PSK"]).toBe("supersecretpsk123");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(ipsecPskRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Sites List ──────────────────────────────────────────────────────────

describe("magic-transit sites list", () => {
  test("lists sites", async () => {
    const sites = [sampleSite(), sampleSite({ id: "site-2", name: "other-site" })];
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return { sites };
      },
    });

    await sitesListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

// ─── Sites Get ───────────────────────────────────────────────────────────

describe("magic-transit sites get", () => {
  test("gets a site by ID", async () => {
    const site = sampleSite();
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return { site };
      },
    });

    await sitesGetRun(["--id", SITE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-site");
    expect(output.captured.details[0]!["Description"]).toBe("Branch office");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(sitesGetRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Sites Create ────────────────────────────────────────────────────────

describe("magic-transit sites create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = mtCtx();
    expect(sitesCreateRun([], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = mtCtx();
    expect(sitesCreateRun([
      "--file", "/tmp/nonexistent-cf-cli-site.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Sites Update ────────────────────────────────────────────────────────

describe("magic-transit sites update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(sitesUpdateRun(["--file", "test.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = mtCtx();
    expect(sitesUpdateRun(["--id", SITE_ID], ctx)).rejects.toThrow("--file");
  });
});

// ─── Sites Delete ────────────────────────────────────────────────────────

describe("magic-transit sites delete", () => {
  test("deletes a site with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await sitesDeleteRun(["--id", SITE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(SITE_ID);
    expect(deletedPath).toContain("sites");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = mtCtx({}, { yes: undefined });

    await sitesDeleteRun(["--id", SITE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(sitesDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Sites LANs List ─────────────────────────────────────────────────────

describe("magic-transit sites lans list", () => {
  test("lists LANs for a site", async () => {
    const lans = [
      { id: "lan-1", name: "LAN-A", physport: 1, vlan_tag: 100 },
      { id: "lan-2", name: "LAN-B", physport: 2, vlan_tag: 200 },
    ];
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return { lans };
      },
    });

    await lansListRun(["--site", SITE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --site is missing", async () => {
    const { ctx } = mtCtx();
    expect(lansListRun([], ctx)).rejects.toThrow("--site");
  });
});

// ─── Sites WANs List ─────────────────────────────────────────────────────

describe("magic-transit sites wans list", () => {
  test("lists WANs for a site", async () => {
    const wans = [
      { id: "wan-1", name: "WAN-A", physport: 1, vlan_tag: 300 },
    ];
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return { wans };
      },
    });

    await wansListRun(["--site", SITE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });

  test("throws when --site is missing", async () => {
    const { ctx } = mtCtx();
    expect(wansListRun([], ctx)).rejects.toThrow("--site");
  });
});

// ─── Routes List ─────────────────────────────────────────────────────────

describe("magic-transit routes list", () => {
  test("lists routes", async () => {
    const routes = [sampleRoute(), sampleRoute({ id: "route-2", prefix: "172.16.0.0/12" })];
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return { routes };
      },
    });

    await routesListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

// ─── Routes Create ───────────────────────────────────────────────────────

describe("magic-transit routes create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = mtCtx();
    expect(routesCreateRun([], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = mtCtx();
    expect(routesCreateRun([
      "--file", "/tmp/nonexistent-cf-cli-route.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Routes Update ───────────────────────────────────────────────────────

describe("magic-transit routes update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(routesUpdateRun(["--file", "test.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = mtCtx();
    expect(routesUpdateRun(["--id", ROUTE_ID], ctx)).rejects.toThrow("--file");
  });
});

// ─── Routes Delete ───────────────────────────────────────────────────────

describe("magic-transit routes delete", () => {
  test("deletes a route with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await routesDeleteRun(["--id", ROUTE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(ROUTE_ID);
    expect(deletedPath).toContain("routes");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = mtCtx({}, { yes: undefined });

    await routesDeleteRun(["--id", ROUTE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(routesDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── ACLs List ───────────────────────────────────────────────────────────

describe("magic-transit acls list", () => {
  test("lists ACLs", async () => {
    const acls = [sampleACL(), sampleACL({ id: "acl-2", name: "other-acl" })];
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return { acls };
      },
    });

    await aclsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

// ─── ACLs Create ─────────────────────────────────────────────────────────

describe("magic-transit acls create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = mtCtx();
    expect(aclsCreateRun([], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = mtCtx();
    expect(aclsCreateRun([
      "--file", "/tmp/nonexistent-cf-cli-acl.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── ACLs Update ─────────────────────────────────────────────────────────

describe("magic-transit acls update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(aclsUpdateRun(["--file", "test.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = mtCtx();
    expect(aclsUpdateRun(["--id", ACL_ID], ctx)).rejects.toThrow("--file");
  });
});

// ─── ACLs Delete ─────────────────────────────────────────────────────────

describe("magic-transit acls delete", () => {
  test("deletes an ACL with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await aclsDeleteRun(["--id", ACL_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(ACL_ID);
    expect(deletedPath).toContain("acls");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = mtCtx({}, { yes: undefined });

    await aclsDeleteRun(["--id", ACL_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(aclsDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── PCAPs List ──────────────────────────────────────────────────────────

describe("magic-transit pcaps list", () => {
  test("lists packet captures", async () => {
    const pcaps = [samplePCAP(), samplePCAP({ id: "pcap-2", status: "pending" })];
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return pcaps;
      },
    });

    await pcapsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

// ─── PCAPs Get ───────────────────────────────────────────────────────────

describe("magic-transit pcaps get", () => {
  test("gets a PCAP by ID", async () => {
    const pcap = samplePCAP();
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return pcap;
      },
    });

    await pcapsGetRun(["--id", PCAP_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Status"]).toBe("success");
    expect(output.captured.details[0]!["System"]).toBe("magic-transit");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(pcapsGetRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── PCAPs Create ────────────────────────────────────────────────────────

describe("magic-transit pcaps create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = mtCtx();
    expect(pcapsCreateRun([], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = mtCtx();
    expect(pcapsCreateRun([
      "--file", "/tmp/nonexistent-cf-cli-pcap.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── PCAPs Download ──────────────────────────────────────────────────────

describe("magic-transit pcaps download", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = mtCtx();
    expect(pcapsDownloadRun(["--output-file", "/tmp/test.pcap"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --output-file is missing", async () => {
    const { ctx } = mtCtx();
    expect(pcapsDownloadRun(["--id", PCAP_ID], ctx)).rejects.toThrow("--output-file");
  });

  test("downloads PCAP to file", async () => {
    const outputPath = `/tmp/cf-cli-test-pcap-${Date.now()}.pcap`;
    const { ctx, output } = mtCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return "binary-pcap-data-here";
      },
    });

    await pcapsDownloadRun(["--id", PCAP_ID, "--output-file", outputPath, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("downloaded");

    // Clean up
    try { await Bun.file(outputPath).exists() && (await import("fs")).unlinkSync(outputPath); } catch { /* ignore */ }
  });
});

// ─── Routers ─────────────────────────────────────────────────────────────

describe("magic-transit main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown magic-transit command");
  });

  test("routes gre-tunnels subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["gre-tunnels"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes ipsec-tunnels subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["ipsec-tunnels"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes sites subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["sites"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes routes subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["routes"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes acls subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["acls"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes pcaps subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["pcaps"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("gre-tunnels router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await greRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(greRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown gre-tunnels command");
  });
});

describe("ipsec-tunnels router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await ipsecRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(ipsecRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown ipsec-tunnels command");
  });
});

describe("sites router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await sitesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(sitesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown sites command");
  });
});

describe("routes router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown routes command");
  });
});

describe("acls router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await aclsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(aclsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown acls command");
  });
});

describe("pcaps router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await pcapsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(pcapsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown pcaps command");
  });
});
