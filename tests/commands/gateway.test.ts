import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Gateway router
import { run as gatewayRouterRun } from "../../src/commands/gateway/index.js";

// Gateway DNS
import { run as dnsRouterRun } from "../../src/commands/gateway/dns/index.js";
import { run as dnsPoliciesListRun } from "../../src/commands/gateway/dns-policies/list.js";
import { run as dnsPoliciesCreateRun } from "../../src/commands/gateway/dns-policies/create.js";
import { run as dnsPoliciesUpdateRun } from "../../src/commands/gateway/dns-policies/update.js";
import { run as dnsPoliciesDeleteRun } from "../../src/commands/gateway/dns-policies/delete.js";
import { run as dnsPoliciesRouterRun } from "../../src/commands/gateway/dns-policies/index.js";

// Gateway HTTP
import { run as httpRouterRun } from "../../src/commands/gateway/http/index.js";
import { run as httpPoliciesListRun } from "../../src/commands/gateway/http-policies/list.js";
import { run as httpPoliciesCreateRun } from "../../src/commands/gateway/http-policies/create.js";
import { run as httpPoliciesUpdateRun } from "../../src/commands/gateway/http-policies/update.js";
import { run as httpPoliciesDeleteRun } from "../../src/commands/gateway/http-policies/delete.js";
import { run as httpPoliciesRouterRun } from "../../src/commands/gateway/http-policies/index.js";

// Gateway Network
import { run as networkRouterRun } from "../../src/commands/gateway/network/index.js";
import { run as networkPoliciesListRun } from "../../src/commands/gateway/network-policies/list.js";
import { run as networkPoliciesRouterRun } from "../../src/commands/gateway/network-policies/index.js";

// Gateway DLP
import { run as dlpRouterRun } from "../../src/commands/gateway/dlp/index.js";
import { run as dlpProfilesListRun } from "../../src/commands/gateway/dlp-profiles/list.js";
import { run as dlpProfilesCreateRun } from "../../src/commands/gateway/dlp-profiles/create.js";
import { run as dlpProfilesDeleteRun } from "../../src/commands/gateway/dlp-profiles/delete.js";
import { run as dlpProfilesRouterRun } from "../../src/commands/gateway/dlp-profiles/index.js";

const ACCOUNT_ID = "acc-uuid-123";
const POLICY_ID = "gw-pol-uuid-456";
const DLP_ID = "dlp-uuid-789";

function sampleGatewayPolicy(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: POLICY_ID,
    name: "Block Malware",
    action: "block",
    precedence: 1,
    enabled: true,
    filters: ["dns"],
    traffic: "any(dns.domains[*] in $malware_domains)",
    created_at: "2024-06-01T12:00:00.000Z",
    updated_at: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleHttpPolicy(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "http-pol-uuid-123",
    name: "Block Social",
    action: "block",
    precedence: 2,
    enabled: true,
    filters: ["http"],
    traffic: "http.request.uri.host in $social_media",
    created_at: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleNetworkPolicy(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "net-pol-uuid-123",
    name: "Block SSH",
    action: "block",
    precedence: 3,
    enabled: true,
    filters: ["l4"],
    traffic: "net.dst.port == 22",
    created_at: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleDLPProfile(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: DLP_ID,
    name: "SSN Detection",
    type: "custom",
    description: "Detect social security numbers",
    entries: [
      { id: "entry-1", name: "SSN Pattern", enabled: true },
    ],
    created_at: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

// ─── Gateway DNS Policies ────────────────────────────────────────────────

describe("gateway dns policies list", () => {
  test("lists DNS policies (filters by dns)", async () => {
    const allPolicies = [
      sampleGatewayPolicy(),
      sampleHttpPolicy(),
      sampleNetworkPolicy(),
    ];
    const { ctx, output } = createTestContext({
      get: async () => allPolicies,
    });

    await dnsPoliciesListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    // Only DNS policies should appear
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });
});

describe("gateway dns policies create", () => {
  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(dnsPoliciesCreateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("gateway dns policies update", () => {
  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(dnsPoliciesUpdateRun(["--account-id", ACCOUNT_ID, "--file", "x.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(dnsPoliciesUpdateRun(["--account-id", ACCOUNT_ID, "--id", POLICY_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("gateway dns policies delete", () => {
  test("deletes a DNS policy with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return undefined;
      },
    });

    await dnsPoliciesDeleteRun(["--account-id", ACCOUNT_ID, "--id", POLICY_ID], ctx);

    expect(deletedPath).toContain(POLICY_ID);
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await dnsPoliciesDeleteRun(["--account-id", ACCOUNT_ID, "--id", POLICY_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(dnsPoliciesDeleteRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("gateway dns policies router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await dnsPoliciesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(dnsPoliciesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown gateway dns policies command");
  });
});

// ─── Gateway HTTP Policies ───────────────────────────────────────────────

describe("gateway http policies list", () => {
  test("lists HTTP policies (filters by http)", async () => {
    const allPolicies = [
      sampleGatewayPolicy(),
      sampleHttpPolicy(),
      sampleNetworkPolicy(),
    ];
    const { ctx, output } = createTestContext({
      get: async () => allPolicies,
    });

    await httpPoliciesListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });
});

describe("gateway http policies create", () => {
  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(httpPoliciesCreateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("gateway http policies update", () => {
  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(httpPoliciesUpdateRun(["--account-id", ACCOUNT_ID, "--file", "x.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(httpPoliciesUpdateRun(["--account-id", ACCOUNT_ID, "--id", POLICY_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("gateway http policies delete", () => {
  test("deletes an HTTP policy with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return undefined;
      },
    });

    await httpPoliciesDeleteRun(["--account-id", ACCOUNT_ID, "--id", POLICY_ID], ctx);

    expect(deletedPath).toContain(POLICY_ID);
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await httpPoliciesDeleteRun(["--account-id", ACCOUNT_ID, "--id", POLICY_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

describe("gateway http policies router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await httpPoliciesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(httpPoliciesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown gateway http policies command");
  });
});

// ─── Gateway Network Policies ────────────────────────────────────────────

describe("gateway network policies list", () => {
  test("lists network policies (filters by l4)", async () => {
    const allPolicies = [
      sampleGatewayPolicy(),
      sampleHttpPolicy(),
      sampleNetworkPolicy(),
    ];
    const { ctx, output } = createTestContext({
      get: async () => allPolicies,
    });

    await networkPoliciesListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });
});

describe("gateway network policies router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await networkPoliciesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(networkPoliciesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown gateway network policies command");
  });
});

// ─── Gateway DLP Profiles ────────────────────────────────────────────────

describe("gateway dlp profiles list", () => {
  test("lists DLP profiles", async () => {
    const profiles = [sampleDLPProfile(), sampleDLPProfile({ id: "dlp-2", name: "Credit Card" })];
    const { ctx, output } = createTestContext({
      get: async () => profiles,
    });

    await dlpProfilesListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("gateway dlp profiles create", () => {
  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(dlpProfilesCreateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("gateway dlp profiles delete", () => {
  test("deletes a DLP profile with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return undefined;
      },
    });

    await dlpProfilesDeleteRun(["--account-id", ACCOUNT_ID, "--id", DLP_ID], ctx);

    expect(deletedPath).toContain(DLP_ID);
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await dlpProfilesDeleteRun(["--account-id", ACCOUNT_ID, "--id", DLP_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(dlpProfilesDeleteRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("gateway dlp profiles router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await dlpProfilesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(dlpProfilesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown gateway dlp profiles command");
  });
});

// ─── Gateway DNS Router ──────────────────────────────────────────────────

describe("gateway dns router", () => {
  test("routes to policies", async () => {
    const { ctx, output } = createTestContext();
    await dnsRouterRun(["policies"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await dnsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(dnsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown gateway dns command");
  });
});

// ─── Gateway HTTP Router ─────────────────────────────────────────────────

describe("gateway http router", () => {
  test("routes to policies", async () => {
    const { ctx, output } = createTestContext();
    await httpRouterRun(["policies"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await httpRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(httpRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown gateway http command");
  });
});

// ─── Gateway Network Router ──────────────────────────────────────────────

describe("gateway network router", () => {
  test("routes to policies", async () => {
    const { ctx, output } = createTestContext();
    await networkRouterRun(["policies"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await networkRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(networkRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown gateway network command");
  });
});

// ─── Gateway DLP Router ──────────────────────────────────────────────────

describe("gateway dlp router", () => {
  test("routes to profiles", async () => {
    const { ctx, output } = createTestContext();
    await dlpRouterRun(["profiles"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await dlpRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(dlpRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown gateway dlp command");
  });
});

// ─── Gateway Main Router ─────────────────────────────────────────────────

describe("gateway router", () => {
  test("routes to dns", async () => {
    const { ctx, output } = createTestContext();
    await gatewayRouterRun(["dns"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to http", async () => {
    const { ctx, output } = createTestContext();
    await gatewayRouterRun(["http"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to network", async () => {
    const { ctx, output } = createTestContext();
    await gatewayRouterRun(["network"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to dlp", async () => {
    const { ctx, output } = createTestContext();
    await gatewayRouterRun(["dlp"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await gatewayRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(gatewayRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown gateway command");
  });
});
