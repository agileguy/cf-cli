import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as dashboardRun } from "../../src/commands/zones/analytics/dashboard.js";
import { run as coloRun } from "../../src/commands/zones/analytics/colo.js";
import { run as dnsRun } from "../../src/commands/zones/analytics/dns.js";
import { run as routerRun } from "../../src/commands/zones/analytics/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";

describe("zones analytics dashboard", () => {
  test("gets dashboard analytics", async () => {
    const dashboardData = {
      totals: { requests: { all: 100000 }, bandwidth: { all: 500000 } },
      timeseries: [{ since: "2024-01-01", until: "2024-01-02", requests: { all: 1000 } }],
    };
    const { ctx, output } = createTestContext({
      get: async () => dashboardData,
    });

    await dashboardRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(dashboardData);
  });

  test("passes date range params", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        capturedParams = params;
        return {};
      },
    });

    await dashboardRun(["--zone", ZONE_ID, "--from", "2024-01-01", "--to", "2024-06-01"], ctx);

    expect(capturedParams!["since"]).toBe("2024-01-01");
    expect(capturedParams!["until"]).toBe("2024-06-01");
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(dashboardRun([], ctx)).rejects.toThrow("--zone");
  });
});

describe("zones analytics colo", () => {
  test("gets colo analytics", async () => {
    const coloData = [
      { colo_id: "SJC", timeseries: [{ requests: 100 }] },
      { colo_id: "LAX", timeseries: [{ requests: 200 }] },
    ];
    const { ctx, output } = createTestContext({
      get: async () => coloData,
    });

    await coloRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(coloRun([], ctx)).rejects.toThrow("--zone");
  });

  test("passes date range params", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        capturedParams = params;
        return [];
      },
    });

    await coloRun(["--zone", ZONE_ID, "--from", "2024-01-01", "--to", "2024-06-01"], ctx);

    expect(capturedParams!["since"]).toBe("2024-01-01");
    expect(capturedParams!["until"]).toBe("2024-06-01");
  });
});

describe("zones analytics dns", () => {
  test("gets DNS analytics", async () => {
    const dnsData = {
      data: [{ dimensions: ["example.com"], metrics: [100, 200] }],
      totals: { queryCount: 300 },
      rows: 1,
    };
    const { ctx, output } = createTestContext({
      get: async () => dnsData,
    });

    await dnsRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(dnsRun([], ctx)).rejects.toThrow("--zone");
  });

  test("resolves zone name to ID", async () => {
    let capturedPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        capturedPath = path;
        if (path === "/zones") return [{ id: ZONE_ID }];
        return {};
      },
    });

    await dnsRun(["--zone", "example.com"], ctx);

    expect(capturedPath).toContain(ZONE_ID);
  });
});

describe("zones analytics router", () => {
  test("routes to dashboard", async () => {
    const { ctx, output } = createTestContext({
      get: async () => ({}),
    });
    await routerRun(["dashboard", "--zone", ZONE_ID], ctx);
    expect(output.captured.jsons).toHaveLength(1);
  });

  test("routes to colo", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["colo", "--zone", ZONE_ID], ctx);
    expect(output.captured.jsons).toHaveLength(1);
  });

  test("routes to dns", async () => {
    const { ctx, output } = createTestContext({
      get: async () => ({}),
    });
    await routerRun(["dns", "--zone", ZONE_ID], ctx);
    expect(output.captured.jsons).toHaveLength(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown analytics command");
  });
});
