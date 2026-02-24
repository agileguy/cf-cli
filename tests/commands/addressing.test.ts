import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Address Maps
import { run as amListRun } from "../../src/commands/addressing/address-maps/list.js";
import { run as amGetRun } from "../../src/commands/addressing/address-maps/get.js";
import { run as amCreateRun } from "../../src/commands/addressing/address-maps/create.js";
import { run as amUpdateRun } from "../../src/commands/addressing/address-maps/update.js";
import { run as amDeleteRun } from "../../src/commands/addressing/address-maps/delete.js";
import { run as amRouterRun } from "../../src/commands/addressing/address-maps/index.js";

// Prefixes
import { run as pfListRun } from "../../src/commands/addressing/prefixes/list.js";
import { run as pfGetRun } from "../../src/commands/addressing/prefixes/get.js";
import { run as pfCreateRun } from "../../src/commands/addressing/prefixes/create.js";
import { run as pfUpdateRun } from "../../src/commands/addressing/prefixes/update.js";
import { run as pfDeleteRun } from "../../src/commands/addressing/prefixes/delete.js";
import { run as pfBgpListRun } from "../../src/commands/addressing/prefixes/bgp-list.js";
import { run as pfDelegationsListRun } from "../../src/commands/addressing/prefixes/delegations-list.js";
import { run as pfRouterRun } from "../../src/commands/addressing/prefixes/index.js";

// Regional Hostnames
import { run as rhListRun } from "../../src/commands/addressing/regional-hostnames/list.js";
import { run as rhCreateRun } from "../../src/commands/addressing/regional-hostnames/create.js";
import { run as rhUpdateRun } from "../../src/commands/addressing/regional-hostnames/update.js";
import { run as rhDeleteRun } from "../../src/commands/addressing/regional-hostnames/delete.js";
import { run as rhRouterRun } from "../../src/commands/addressing/regional-hostnames/index.js";

// Main router
import { run as mainRouterRun } from "../../src/commands/addressing/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";
const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const MAP_ID = "am-uuid-123";
const PREFIX_ID = "pf-uuid-456";

function sampleAddressMap(overrides: Record<string, unknown> = {}) {
  return {
    id: MAP_ID,
    description: "Test address map",
    default_sni: "example.com",
    enabled: true,
    can_delete: true,
    can_modify_ips: true,
    ips: [{ type: "ipv4", ip: "192.0.2.1" }],
    memberships: [{ kind: "zone", identifier: ZONE_ID }],
    created_at: "2024-01-01T00:00:00.000Z",
    modified_at: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function samplePrefix(overrides: Record<string, unknown> = {}) {
  return {
    id: PREFIX_ID,
    cidr: "192.0.2.0/24",
    asn: 13335,
    description: "Test prefix",
    account_id: ACCOUNT_ID,
    approved: "true",
    advertised: true,
    on_demand_enabled: false,
    on_demand_locked: false,
    loa_document_id: "loa-123",
    created_at: "2024-01-01T00:00:00.000Z",
    modified_at: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleBGPPrefix(overrides: Record<string, unknown> = {}) {
  return {
    id: "bgp-uuid-789",
    cidr: "192.0.2.0/24",
    signaling: { status: "active", modified_at: "2024-06-01T12:00:00.000Z" },
    on_demand: { advertised: true, advertised_modified_at: "2024-06-01T12:00:00.000Z" },
    created_at: "2024-01-01T00:00:00.000Z",
    modified_at: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleDelegation(overrides: Record<string, unknown> = {}) {
  return {
    id: "del-uuid-101",
    cidr: "192.0.2.0/26",
    delegated_account_id: "delegated-account-123",
    parent_prefix_id: PREFIX_ID,
    description: "Delegated prefix",
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function sampleRegionalHostname(overrides: Record<string, unknown> = {}) {
  return {
    hostname: "api.example.com",
    region_key: "eu",
    created_on: "2024-01-01T00:00:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

/** Helper: wraps createTestContext to auto-resolve account ID */
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

// ─── Main Addressing Router ──────────────────────────────────────────────

describe("addressing main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("shows help with --help", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["--help"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown addressing command");
  });

  test("routes 'address-maps' subcommand", async () => {
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await mainRouterRun(["address-maps", "list"], ctx);
    expect(output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'prefixes' subcommand", async () => {
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await mainRouterRun(["prefixes", "list"], ctx);
    expect(output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'regional-hostnames' subcommand", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await mainRouterRun(["regional-hostnames", "list", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Address Maps Router ─────────────────────────────────────────────────

describe("address-maps router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await amRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(amRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown address-maps command");
  });
});

// ─── Address Maps List ───────────────────────────────────────────────────

describe("address-maps list", () => {
  test("lists address maps", async () => {
    const maps = [sampleAddressMap(), sampleAddressMap({ id: "am-2", description: "Second map" })];
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return maps;
      },
    });

    await amListRun([], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("lists empty address maps", async () => {
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });

    await amListRun([], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(0);
  });

  test("passes explicit --account-id", async () => {
    let calledPath = "";
    const { ctx } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        calledPath = path;
        return [];
      },
    });

    await amListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain(ACCOUNT_ID);
  });
});

// ─── Address Maps Get ────────────────────────────────────────────────────

describe("address-maps get", () => {
  test("gets an address map by ID", async () => {
    const map = sampleAddressMap();
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return map;
      },
    });

    await amGetRun(["--id", MAP_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe(MAP_ID);
    expect(output.captured.details[0]!["Description"]).toBe("Test address map");
    expect(output.captured.details[0]!["Default SNI"]).toBe("example.com");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(amGetRun([], ctx)).rejects.toThrow("--id");
  });

  test("calls correct API path", async () => {
    let calledPath = "";
    const { ctx } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        calledPath = path;
        return sampleAddressMap();
      },
    });

    await amGetRun(["--id", MAP_ID], ctx);

    expect(calledPath).toContain(`/addressing/address_maps/${MAP_ID}`);
  });
});

// ─── Address Maps Create ─────────────────────────────────────────────────

describe("address-maps create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(amCreateRun([], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = aCtx();
    expect(amCreateRun(["--file", "/tmp/nonexistent-cf-cli-am.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Address Maps Update ─────────────────────────────────────────────────

describe("address-maps update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(amUpdateRun(["--file", "map.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(amUpdateRun(["--id", MAP_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = aCtx();
    expect(amUpdateRun(["--id", MAP_ID, "--file", "/tmp/nonexistent-cf-cli-am-update.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Address Maps Delete ─────────────────────────────────────────────────

describe("address-maps delete", () => {
  test("deletes an address map with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = aCtx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await amDeleteRun(["--id", MAP_ID], ctx);

    expect(deletedPath).toContain(MAP_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = aCtx({}, { yes: undefined });

    await amDeleteRun(["--id", MAP_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(amDeleteRun([], ctx)).rejects.toThrow("--id");
  });

  test("calls correct API path", async () => {
    let deletedPath = "";
    const { ctx } = aCtx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await amDeleteRun(["--id", MAP_ID], ctx);

    expect(deletedPath).toContain(`/addressing/address_maps/${MAP_ID}`);
  });
});

// ─── Prefixes Router ────────────────────────────────────────────────────

describe("prefixes router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await pfRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(pfRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown prefixes command");
  });

  test("routes 'bgp-prefixes' subcommand", async () => {
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await pfRouterRun(["bgp-prefixes", "--prefix", PREFIX_ID], ctx);
    expect(output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'bgp' alias subcommand", async () => {
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await pfRouterRun(["bgp", "--prefix", PREFIX_ID], ctx);
    expect(output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'delegations' subcommand", async () => {
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await pfRouterRun(["delegations", "--prefix", PREFIX_ID], ctx);
    expect(output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Prefixes List ──────────────────────────────────────────────────────

describe("prefixes list", () => {
  test("lists prefixes", async () => {
    const prefixes = [samplePrefix(), samplePrefix({ id: "pf-2", cidr: "10.0.0.0/8" })];
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return prefixes;
      },
    });

    await pfListRun([], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

// ─── Prefixes Get ───────────────────────────────────────────────────────

describe("prefixes get", () => {
  test("gets a prefix by ID", async () => {
    const prefix = samplePrefix();
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return prefix;
      },
    });

    await pfGetRun(["--id", PREFIX_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe(PREFIX_ID);
    expect(output.captured.details[0]!["CIDR"]).toBe("192.0.2.0/24");
    expect(output.captured.details[0]!["ASN"]).toBe(13335);
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(pfGetRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Prefixes Create ────────────────────────────────────────────────────

describe("prefixes create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(pfCreateRun([], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = aCtx();
    expect(pfCreateRun(["--file", "/tmp/nonexistent-cf-cli-pf.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Prefixes Update ────────────────────────────────────────────────────

describe("prefixes update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(pfUpdateRun(["--file", "pf.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(pfUpdateRun(["--id", PREFIX_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = aCtx();
    expect(pfUpdateRun(["--id", PREFIX_ID, "--file", "/tmp/nonexistent-cf-cli-pf-upd.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Prefixes Delete ────────────────────────────────────────────────────

describe("prefixes delete", () => {
  test("deletes a prefix with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = aCtx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await pfDeleteRun(["--id", PREFIX_ID], ctx);

    expect(deletedPath).toContain(PREFIX_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = aCtx({}, { yes: undefined });

    await pfDeleteRun(["--id", PREFIX_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(pfDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── BGP Prefixes List ──────────────────────────────────────────────────

describe("bgp-prefixes list", () => {
  test("lists BGP prefixes for a prefix", async () => {
    const bgps = [sampleBGPPrefix(), sampleBGPPrefix({ id: "bgp-2" })];
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return bgps;
      },
    });

    await pfBgpListRun(["--prefix", PREFIX_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --prefix is missing", async () => {
    const { ctx } = createTestContext();
    expect(pfBgpListRun([], ctx)).rejects.toThrow("--prefix");
  });

  test("calls correct API path", async () => {
    let calledPath = "";
    const { ctx } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        calledPath = path;
        return [];
      },
    });

    await pfBgpListRun(["--prefix", PREFIX_ID], ctx);

    expect(calledPath).toContain(`/prefixes/${PREFIX_ID}/bgp/prefixes`);
  });
});

// ─── Delegations List ───────────────────────────────────────────────────

describe("delegations list", () => {
  test("lists delegations for a prefix", async () => {
    const dels = [sampleDelegation(), sampleDelegation({ id: "del-2" })];
    const { ctx, output } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return dels;
      },
    });

    await pfDelegationsListRun(["--prefix", PREFIX_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --prefix is missing", async () => {
    const { ctx } = createTestContext();
    expect(pfDelegationsListRun([], ctx)).rejects.toThrow("--prefix");
  });

  test("calls correct API path", async () => {
    let calledPath = "";
    const { ctx } = aCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        calledPath = path;
        return [];
      },
    });

    await pfDelegationsListRun(["--prefix", PREFIX_ID], ctx);

    expect(calledPath).toContain(`/prefixes/${PREFIX_ID}/delegations`);
  });
});

// ─── Regional Hostnames Router ──────────────────────────────────────────

describe("regional-hostnames router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await rhRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(rhRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown regional-hostnames command");
  });
});

// ─── Regional Hostnames List ────────────────────────────────────────────

describe("regional-hostnames list", () => {
  test("lists regional hostnames", async () => {
    const hostnames = [sampleRegionalHostname(), sampleRegionalHostname({ hostname: "cdn.example.com", region_key: "us" })];
    const { ctx, output } = createTestContext({
      get: async () => hostnames,
    });

    await rhListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(rhListRun([], ctx)).rejects.toThrow("--zone");
  });

  test("calls correct API path", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return [];
      },
    });

    await rhListRun(["--zone", ZONE_ID], ctx);

    expect(calledPath).toContain("/addressing/regional_hostnames");
    expect(calledPath).toContain(ZONE_ID);
  });
});

// ─── Regional Hostnames Create ──────────────────────────────────────────

describe("regional-hostnames create", () => {
  test("creates a regional hostname", async () => {
    const rh = sampleRegionalHostname();
    const { ctx, output } = createTestContext({
      post: async () => rh,
    });

    await rhCreateRun(["--zone", ZONE_ID, "--hostname", "api.example.com", "--region", "eu"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("created");
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Hostname"]).toBe("api.example.com");
    expect(output.captured.details[0]!["Region"]).toBe("eu");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(rhCreateRun(["--hostname", "api.example.com", "--region", "eu"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --hostname is missing", async () => {
    const { ctx } = createTestContext();
    expect(rhCreateRun(["--zone", ZONE_ID, "--region", "eu"], ctx)).rejects.toThrow("--hostname");
  });

  test("throws when --region is missing", async () => {
    const { ctx } = createTestContext();
    expect(rhCreateRun(["--zone", ZONE_ID, "--hostname", "api.example.com"], ctx)).rejects.toThrow("--region");
  });

  test("sends correct body to API", async () => {
    let postedBody: unknown;
    const { ctx } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        postedBody = body;
        return sampleRegionalHostname();
      },
    });

    await rhCreateRun(["--zone", ZONE_ID, "--hostname", "api.example.com", "--region", "eu"], ctx);

    expect(postedBody).toEqual({ hostname: "api.example.com", region_key: "eu" });
  });
});

// ─── Regional Hostnames Update ──────────────────────────────────────────

describe("regional-hostnames update", () => {
  test("updates a regional hostname", async () => {
    const rh = sampleRegionalHostname({ region_key: "us" });
    let patchedPath = "";
    const { ctx, output } = createTestContext({
      patch: async (path: string) => {
        patchedPath = path;
        return rh;
      },
    });

    await rhUpdateRun(["--zone", ZONE_ID, "--hostname", "api.example.com", "--region", "us"], ctx);

    expect(patchedPath).toContain("api.example.com");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("updated");
  });

  test("uses hostname in URL path (not query param)", async () => {
    let patchedPath = "";
    const { ctx } = createTestContext({
      patch: async (path: string) => {
        patchedPath = path;
        return sampleRegionalHostname();
      },
    });

    await rhUpdateRun(["--zone", ZONE_ID, "--hostname", "api.example.com", "--region", "us"], ctx);

    expect(patchedPath).toContain("/regional_hostnames/api.example.com");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(rhUpdateRun(["--hostname", "api.example.com", "--region", "us"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --hostname is missing", async () => {
    const { ctx } = createTestContext();
    expect(rhUpdateRun(["--zone", ZONE_ID, "--region", "us"], ctx)).rejects.toThrow("--hostname");
  });

  test("throws when --region is missing", async () => {
    const { ctx } = createTestContext();
    expect(rhUpdateRun(["--zone", ZONE_ID, "--hostname", "api.example.com"], ctx)).rejects.toThrow("--region");
  });
});

// ─── Regional Hostnames Delete ──────────────────────────────────────────

describe("regional-hostnames delete", () => {
  test("deletes a regional hostname with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await rhDeleteRun(["--zone", ZONE_ID, "--hostname", "api.example.com"], ctx);

    expect(deletedPath).toContain("api.example.com");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("uses hostname in URL path for delete", async () => {
    let deletedPath = "";
    const { ctx } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await rhDeleteRun(["--zone", ZONE_ID, "--hostname", "api.example.com"], ctx);

    expect(deletedPath).toContain("/regional_hostnames/api.example.com");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await rhDeleteRun(["--zone", ZONE_ID, "--hostname", "api.example.com"], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(rhDeleteRun(["--hostname", "api.example.com"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --hostname is missing", async () => {
    const { ctx } = createTestContext();
    expect(rhDeleteRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--hostname");
  });
});
