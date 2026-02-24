import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Radar commands
import { run as httpRun } from "../../src/commands/radar/http.js";
import { run as dnsRun } from "../../src/commands/radar/dns.js";
import { run as bgpRun } from "../../src/commands/radar/bgp.js";
import { run as attacksRun } from "../../src/commands/radar/attacks.js";
import { run as botsRun } from "../../src/commands/radar/bots.js";
import { run as emailRun } from "../../src/commands/radar/email.js";
import { run as asRun } from "../../src/commands/radar/as.js";
import { run as locationsRun } from "../../src/commands/radar/locations.js";
import { run as datasetsRun } from "../../src/commands/radar/datasets.js";
import { run as annotationsRun } from "../../src/commands/radar/annotations.js";

// Router
import { run as routerRun } from "../../src/commands/radar/index.js";

function sampleRadarSummary(overrides: Record<string, unknown> = {}) {
  return {
    summary_0: { total: 1000, http_version: { "2": 60, "3": 40 } },
    meta: { dateRange: [{ startTime: "2024-01-01", endTime: "2024-06-01" }] },
    ...overrides,
  };
}

function sampleRadarBot(overrides: Record<string, unknown> = {}) {
  return {
    name: "Googlebot",
    category: "Search Engine",
    owner: "Google",
    ...overrides,
  };
}

function sampleRadarASN(overrides: Record<string, unknown> = {}) {
  return {
    asn: 13335,
    name: "Cloudflare Inc",
    country: "US",
    country_code: "US",
    website: "https://www.cloudflare.com",
    ...overrides,
  };
}

function sampleRadarLocation(overrides: Record<string, unknown> = {}) {
  return {
    code: "US",
    name: "United States",
    region: "Northern America",
    subregion: "Northern America",
    ...overrides,
  };
}

function sampleRadarDataset(overrides: Record<string, unknown> = {}) {
  return {
    id: "ds-1",
    title: "HTTP Requests",
    description: "HTTP request dataset",
    type: "timeseries",
    ...overrides,
  };
}

function sampleRadarAnnotation(overrides: Record<string, unknown> = {}) {
  return {
    id: "ann-1",
    description: "Network outage in AS12345",
    data_source: "bgp",
    start_date: "2024-03-15T00:00:00Z",
    end_date: "2024-03-15T12:00:00Z",
    event_type: "outage",
    ...overrides,
  };
}

// ─── Main Router ────────────────────────────────────────────────────────

describe("radar main router", () => {
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
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown radar command");
  });

  test("routes 'http' subcommand", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleRadarSummary(),
    });
    await routerRun(["http"], ctx);
    expect(output.captured.jsons).toHaveLength(1);
  });

  test("routes 'dns' subcommand", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleRadarSummary(),
    });
    await routerRun(["dns"], ctx);
    expect(output.captured.jsons).toHaveLength(1);
  });

  test("routes 'locations' subcommand", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [sampleRadarLocation()],
    });
    await routerRun(["locations"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });
});

// ─── HTTP Summary ───────────────────────────────────────────────────────

describe("radar http summary", () => {
  test("fetches HTTP summary", async () => {
    const data = sampleRadarSummary();
    const { ctx, output } = createTestContext({
      get: async () => data,
    });

    await httpRun([], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(data);
  });

  test("passes date range params", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return sampleRadarSummary();
      },
    });

    await httpRun(["--from", "2024-01-01", "--to", "2024-06-01"], ctx);

    expect(gotParams?.dateStart).toBe("2024-01-01");
    expect(gotParams?.dateEnd).toBe("2024-06-01");
  });

  test("passes ASN and location params", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return sampleRadarSummary();
      },
    });

    await httpRun(["--asn", "13335", "--location", "US"], ctx);

    expect(gotParams?.asn).toBe("13335");
    expect(gotParams?.location).toBe("US");
  });
});

// ─── DNS Summary ────────────────────────────────────────────────────────

describe("radar dns summary", () => {
  test("fetches DNS summary", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleRadarSummary(),
    });

    await dnsRun([], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("passes params", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return sampleRadarSummary();
      },
    });

    await dnsRun(["--from", "2024-01-01"], ctx);

    expect(gotParams?.dateStart).toBe("2024-01-01");
  });
});

// ─── BGP Summary ────────────────────────────────────────────────────────

describe("radar bgp summary", () => {
  test("fetches BGP summary", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleRadarSummary(),
    });

    await bgpRun([], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("passes params", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return sampleRadarSummary();
      },
    });

    await bgpRun(["--asn", "64512"], ctx);

    expect(gotParams?.asn).toBe("64512");
  });
});

// ─── Attacks Summary ────────────────────────────────────────────────────

describe("radar attacks summary", () => {
  test("fetches attacks summary", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleRadarSummary(),
    });

    await attacksRun([], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("passes params", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return sampleRadarSummary();
      },
    });

    await attacksRun(["--location", "DE"], ctx);

    expect(gotParams?.location).toBe("DE");
  });
});

// ─── Bots Summary ───────────────────────────────────────────────────────

describe("radar bots summary", () => {
  test("fetches verified bots", async () => {
    const bots = [sampleRadarBot(), sampleRadarBot({ name: "Bingbot" })];
    const { ctx, output } = createTestContext({
      get: async () => bots,
    });

    await botsRun([], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(bots);
  });

  test("passes params", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return [];
      },
    });

    await botsRun(["--from", "2024-01-01", "--to", "2024-06-01"], ctx);

    expect(gotParams?.dateStart).toBe("2024-01-01");
    expect(gotParams?.dateEnd).toBe("2024-06-01");
  });
});

// ─── Email Security Summary ────────────────────────────────────────────

describe("radar email security summary", () => {
  test("fetches email security summary", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleRadarSummary(),
    });

    await emailRun([], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("passes params", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return sampleRadarSummary();
      },
    });

    await emailRun(["--asn", "13335"], ctx);

    expect(gotParams?.asn).toBe("13335");
  });
});

// ─── AS Get ─────────────────────────────────────────────────────────────

describe("radar as get", () => {
  test("fetches ASN details", async () => {
    const asn = sampleRadarASN();
    const { ctx, output } = createTestContext({
      get: async () => asn,
    });

    await asRun(["--asn", "13335"], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(asn);
  });

  test("throws when --asn is missing", async () => {
    const { ctx } = createTestContext();
    expect(asRun([], ctx)).rejects.toThrow("--asn");
  });
});

// ─── Locations ──────────────────────────────────────────────────────────

describe("radar locations list", () => {
  test("lists locations", async () => {
    const locs = [sampleRadarLocation(), sampleRadarLocation({ code: "DE", name: "Germany" })];
    const { ctx, output } = createTestContext({
      get: async () => locs,
    });

    await locationsRun([], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("lists empty locations", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });

    await locationsRun([], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(0);
  });
});

// ─── Datasets ───────────────────────────────────────────────────────────

describe("radar datasets list", () => {
  test("lists datasets", async () => {
    const datasets = [sampleRadarDataset()];
    const { ctx, output } = createTestContext({
      get: async () => datasets,
    });

    await datasetsRun([], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });
});

// ─── Annotations ────────────────────────────────────────────────────────

describe("radar annotations list", () => {
  test("lists annotations", async () => {
    const anns = [sampleRadarAnnotation()];
    const { ctx, output } = createTestContext({
      get: async () => anns,
    });

    await annotationsRun([], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });

  test("passes date range params", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return [];
      },
    });

    await annotationsRun(["--from", "2024-01-01", "--to", "2024-06-01"], ctx);

    expect(gotParams?.dateStart).toBe("2024-01-01");
    expect(gotParams?.dateEnd).toBe("2024-06-01");
  });
});

// ─── API Path Verification ─────────────────────────────────────────────

describe("radar API path verification", () => {
  test("http calls /radar/http/summary", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleRadarSummary();
      },
    });

    await httpRun([], ctx);
    expect(calledPath).toBe("/radar/http/summary");
  });

  test("dns calls /radar/dns/summary", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleRadarSummary();
      },
    });

    await dnsRun([], ctx);
    expect(calledPath).toBe("/radar/dns/summary");
  });

  test("bgp calls /radar/bgp/summary", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleRadarSummary();
      },
    });

    await bgpRun([], ctx);
    expect(calledPath).toBe("/radar/bgp/summary");
  });

  test("attacks calls /radar/attacks/summary", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleRadarSummary();
      },
    });

    await attacksRun([], ctx);
    expect(calledPath).toBe("/radar/attacks/summary");
  });

  test("bots calls /radar/verified_bots/top/bots", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return [];
      },
    });

    await botsRun([], ctx);
    expect(calledPath).toBe("/radar/verified_bots/top/bots");
  });

  test("email calls /radar/email/security/summary", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleRadarSummary();
      },
    });

    await emailRun([], ctx);
    expect(calledPath).toBe("/radar/email/security/summary");
  });

  test("as calls /radar/entities/asns/{asn}", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleRadarASN();
      },
    });

    await asRun(["--asn", "13335"], ctx);
    expect(calledPath).toContain("/radar/entities/asns/13335");
  });

  test("locations calls /radar/entities/locations", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return [];
      },
    });

    await locationsRun([], ctx);
    expect(calledPath).toBe("/radar/entities/locations");
  });

  test("datasets calls /radar/datasets", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return [];
      },
    });

    await datasetsRun([], ctx);
    expect(calledPath).toBe("/radar/datasets");
  });

  test("annotations calls /radar/annotations", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return [];
      },
    });

    await annotationsRun([], ctx);
    expect(calledPath).toBe("/radar/annotations");
  });
});
