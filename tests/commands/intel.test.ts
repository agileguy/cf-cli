import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Intel commands
import { run as domainRun } from "../../src/commands/intel/domain.js";
import { run as ipRun } from "../../src/commands/intel/ip.js";
import { run as asnRun } from "../../src/commands/intel/asn.js";
import { run as dnsRun } from "../../src/commands/intel/dns.js";
import { run as whoisRun } from "../../src/commands/intel/whois.js";
import { run as ipListsRun } from "../../src/commands/intel/ip-lists.js";
import { run as attackSurfaceRun } from "../../src/commands/intel/attack-surface.js";

// Router
import { run as routerRun } from "../../src/commands/intel/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";

function sampleIntelDomain(overrides: Record<string, unknown> = {}) {
  return {
    domain: "example.com",
    risk_score: 5,
    risk_types: [{ id: 1, name: "malware" }],
    content_categories: [{ id: 10, name: "Technology" }],
    ...overrides,
  };
}

function sampleIntelIP(overrides: Record<string, unknown> = {}) {
  return {
    ip: "1.2.3.4",
    risk_score: 3,
    risk_types: [],
    belongs_to_ref: { id: "asn-13335", type: "asn" },
    ...overrides,
  };
}

function sampleIntelASN(overrides: Record<string, unknown> = {}) {
  return {
    asn: 13335,
    description: "Cloudflare Inc",
    country: "US",
    type: "isp",
    ...overrides,
  };
}

function sampleIntelDNS(overrides: Record<string, unknown> = {}) {
  return {
    reverse_records: [
      { first_seen: "2024-01-01", last_seen: "2024-06-01", hostname: "one.example.com" },
    ],
    ...overrides,
  };
}

function sampleIntelWHOIS(overrides: Record<string, unknown> = {}) {
  return {
    domain: "example.com",
    registrar: "CloudFlare Inc.",
    registrant_org: "Example Inc.",
    registrant_country: "US",
    created_date: "2020-01-01",
    updated_date: "2024-01-01",
    expires_date: "2025-01-01",
    nameservers: ["ns1.cloudflare.com", "ns2.cloudflare.com"],
    ...overrides,
  };
}

function sampleIntelIPList(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Tor Exit Nodes",
    description: "Known Tor exit node IPs",
    ...overrides,
  };
}

function sampleIntelAttackSurface(overrides: Record<string, unknown> = {}) {
  return {
    type: "summary",
    data: [{ category: "exposed_services", count: 42 }],
    ...overrides,
  };
}

// ─── Main Router ────────────────────────────────────────────────────────

describe("intel main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("shows help with --help", async () => {
    const { ctx, output } = createTestContext();
    await routerRun(["--help"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown intel command");
  });

  test("routes 'domain' subcommand", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleIntelDomain(),
    });
    await routerRun(["domain", "--domain", "example.com", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.jsons).toHaveLength(1);
  });

  test("routes 'whois' subcommand", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleIntelWHOIS(),
    });
    await routerRun(["whois", "--domain", "example.com", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.jsons).toHaveLength(1);
  });
});

// ─── Domain Lookup ──────────────────────────────────────────────────────

describe("intel domain", () => {
  test("fetches domain intel", async () => {
    const data = sampleIntelDomain();
    const { ctx, output } = createTestContext({
      get: async () => data,
    });

    await domainRun(["--domain", "example.com", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(data);
  });

  test("throws when --domain is missing", async () => {
    const { ctx } = createTestContext();
    expect(domainRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--domain");
  });

  test("passes domain as query param", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return sampleIntelDomain();
      },
    });

    await domainRun(["--domain", "evil.com", "--account-id", ACCOUNT_ID], ctx);

    expect(gotParams?.domain).toBe("evil.com");
  });
});

// ─── IP Lookup ──────────────────────────────────────────────────────────

describe("intel ip", () => {
  test("fetches IP intel (IPv4)", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx, output } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return sampleIntelIP();
      },
    });

    await ipRun(["--ip", "1.2.3.4", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(gotParams?.ipv4).toBe("1.2.3.4");
  });

  test("fetches IP intel (IPv6)", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return sampleIntelIP({ ip: "2001:db8::1" });
      },
    });

    await ipRun(["--ip", "2001:db8::1", "--account-id", ACCOUNT_ID], ctx);

    expect(gotParams?.ipv6).toBe("2001:db8::1");
  });

  test("throws when --ip is missing", async () => {
    const { ctx } = createTestContext();
    expect(ipRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--ip");
  });
});

// ─── ASN Lookup ─────────────────────────────────────────────────────────

describe("intel asn", () => {
  test("fetches ASN intel", async () => {
    const data = sampleIntelASN();
    const { ctx, output } = createTestContext({
      get: async () => data,
    });

    await asnRun(["--asn", "13335", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(data);
  });

  test("throws when --asn is missing", async () => {
    const { ctx } = createTestContext();
    expect(asnRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--asn");
  });

  test("calls correct API path with ASN", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleIntelASN();
      },
    });

    await asnRun(["--asn", "13335", "--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain("/intel/asn/13335");
  });
});

// ─── DNS Lookup ─────────────────────────────────────────────────────────

describe("intel dns", () => {
  test("fetches passive DNS data", async () => {
    const data = sampleIntelDNS();
    const { ctx, output } = createTestContext({
      get: async () => data,
    });

    await dnsRun(["--ip", "1.2.3.4", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(data);
  });

  test("throws when --ip is missing", async () => {
    const { ctx } = createTestContext();
    expect(dnsRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--ip");
  });

  test("uses ipv6 param for IPv6 addresses", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return sampleIntelDNS();
      },
    });

    await dnsRun(["--ip", "::1", "--account-id", ACCOUNT_ID], ctx);

    expect(gotParams?.ipv6).toBe("::1");
  });
});

// ─── WHOIS Lookup ───────────────────────────────────────────────────────

describe("intel whois", () => {
  test("fetches WHOIS data", async () => {
    const data = sampleIntelWHOIS();
    const { ctx, output } = createTestContext({
      get: async () => data,
    });

    await whoisRun(["--domain", "example.com", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(data);
  });

  test("throws when --domain is missing", async () => {
    const { ctx } = createTestContext();
    expect(whoisRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--domain");
  });

  test("passes domain as query param", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return sampleIntelWHOIS();
      },
    });

    await whoisRun(["--domain", "test.org", "--account-id", ACCOUNT_ID], ctx);

    expect(gotParams?.domain).toBe("test.org");
  });
});

// ─── IP Lists ───────────────────────────────────────────────────────────

describe("intel ip-lists", () => {
  test("lists IP lists", async () => {
    const lists = [sampleIntelIPList(), sampleIntelIPList({ id: 2, name: "Botnets" })];
    const { ctx, output } = createTestContext({
      get: async () => lists,
    });

    await ipListsRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("lists empty", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });

    await ipListsRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(0);
  });
});

// ─── Attack Surface ────────────────────────────────────────────────────

describe("intel attack-surface", () => {
  test("fetches attack surface report", async () => {
    const data = sampleIntelAttackSurface();
    const { ctx, output } = createTestContext({
      get: async () => data,
    });

    await attackSurfaceRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("passes type param", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return sampleIntelAttackSurface();
      },
    });

    await attackSurfaceRun(["--account-id", ACCOUNT_ID, "--type", "exposed_infra"], ctx);

    expect(gotParams?.type).toBe("exposed_infra");
  });
});

// ─── API Path Verification ─────────────────────────────────────────────

describe("intel API path verification", () => {
  test("domain calls /accounts/{id}/intel/domain", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleIntelDomain();
      },
    });

    await domainRun(["--domain", "example.com", "--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain("/intel/domain");
    expect(calledPath).toContain(ACCOUNT_ID);
  });

  test("ip calls /accounts/{id}/intel/ip", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleIntelIP();
      },
    });

    await ipRun(["--ip", "1.2.3.4", "--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain("/intel/ip");
  });

  test("whois calls /accounts/{id}/intel/whois", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleIntelWHOIS();
      },
    });

    await whoisRun(["--domain", "example.com", "--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain("/intel/whois");
  });

  test("ip-lists calls /accounts/{id}/intel/ip-list", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return [];
      },
    });

    await ipListsRun(["--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain("/intel/ip-list");
  });

  test("attack-surface calls /accounts/{id}/intel/attack-surface-report", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleIntelAttackSurface();
      },
    });

    await attackSurfaceRun(["--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain("/intel/attack-surface-report");
  });
});
