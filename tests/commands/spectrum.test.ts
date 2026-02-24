import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Spectrum Apps
import { run as appListRun } from "../../src/commands/spectrum/apps/list.js";
import { run as appGetRun } from "../../src/commands/spectrum/apps/get.js";
import { run as appCreateRun } from "../../src/commands/spectrum/apps/create.js";
import { run as appUpdateRun } from "../../src/commands/spectrum/apps/update.js";
import { run as appDeleteRun } from "../../src/commands/spectrum/apps/delete.js";
import { run as appRouterRun } from "../../src/commands/spectrum/apps/index.js";

// Spectrum Analytics
import { run as summaryRun } from "../../src/commands/spectrum/analytics/summary.js";
import { run as bytesRun } from "../../src/commands/spectrum/analytics/bytes.js";
import { run as analyticsRouterRun } from "../../src/commands/spectrum/analytics/index.js";

// Main router
import { run as mainRouterRun } from "../../src/commands/spectrum/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";
const APP_ID = "sa-uuid-123";

function sampleSpectrumApp(overrides: Record<string, unknown> = {}) {
  return {
    id: APP_ID,
    protocol: "tcp/22",
    dns: { type: "CNAME", name: "ssh.example.com" },
    origin_direct: ["tcp://192.0.2.1:22"],
    origin_port: 22,
    origin_dns: { name: "origin.example.com" },
    ip_firewall: true,
    proxy_protocol: "off",
    tls: "full",
    edge_ips: { type: "dynamic", connectivity: "all" },
    argo_smart_routing: false,
    created_on: "2024-01-01T00:00:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleAnalytics(overrides: Record<string, unknown> = {}) {
  return {
    rows: 10,
    data: [{ metrics: { bytes: 1024, connections: 50 } }],
    totals: { bytes: 10240, connections: 500 },
    min: { bytes: 100 },
    max: { bytes: 2000 },
    data_lag: 60,
    query: { since: "2024-01-01", until: "2024-06-01" },
    ...overrides,
  };
}

// ─── Main Spectrum Router ────────────────────────────────────────────────

describe("spectrum main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown spectrum command");
  });

  test("routes 'apps' subcommand", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await mainRouterRun(["apps", "list", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'analytics' to sub-router", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["analytics"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Spectrum Apps Router ────────────────────────────────────────────────

describe("spectrum apps router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await appRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(appRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown spectrum apps command");
  });
});

// ─── Spectrum Apps List ──────────────────────────────────────────────────

describe("spectrum apps list", () => {
  test("lists spectrum apps", async () => {
    const apps = [sampleSpectrumApp(), sampleSpectrumApp({ id: "sa-2", protocol: "tcp/443" })];
    const { ctx, output } = createTestContext({
      get: async () => apps,
    });

    await appListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("lists empty apps", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });

    await appListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(0);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(appListRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Spectrum Apps Get ───────────────────────────────────────────────────

describe("spectrum apps get", () => {
  test("gets a spectrum app by ID", async () => {
    const app = sampleSpectrumApp();
    const { ctx, output } = createTestContext({
      get: async () => app,
    });

    await appGetRun(["--zone", ZONE_ID, "--id", APP_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe(APP_ID);
    expect(output.captured.details[0]!["Protocol"]).toBe("tcp/22");
    expect(output.captured.details[0]!["DNS Name"]).toBe("ssh.example.com");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(appGetRun(["--id", APP_ID], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(appGetRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Spectrum Apps Create ────────────────────────────────────────────────

describe("spectrum apps create", () => {
  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(appCreateRun(["--file", "app.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(appCreateRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = createTestContext();
    expect(appCreateRun(["--zone", ZONE_ID, "--file", "/tmp/nonexistent-cf-cli-sa.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Spectrum Apps Update ────────────────────────────────────────────────

describe("spectrum apps update", () => {
  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(appUpdateRun(["--id", APP_ID, "--file", "app.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(appUpdateRun(["--zone", ZONE_ID, "--file", "app.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(appUpdateRun(["--zone", ZONE_ID, "--id", APP_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = createTestContext();
    expect(appUpdateRun(["--zone", ZONE_ID, "--id", APP_ID, "--file", "/tmp/nonexistent-cf-cli-sa-upd.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Spectrum Apps Delete ────────────────────────────────────────────────

describe("spectrum apps delete", () => {
  test("deletes a spectrum app with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await appDeleteRun(["--zone", ZONE_ID, "--id", APP_ID], ctx);

    expect(deletedPath).toContain(APP_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await appDeleteRun(["--zone", ZONE_ID, "--id", APP_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(appDeleteRun(["--id", APP_ID], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(appDeleteRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Analytics Router ────────────────────────────────────────────────────

describe("spectrum analytics router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await analyticsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(analyticsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown spectrum analytics command");
  });
});

// ─── Analytics Summary ──────────────────────────────────────────────────

describe("spectrum analytics summary", () => {
  test("fetches analytics summary", async () => {
    const data = sampleAnalytics();
    const { ctx, output } = createTestContext({
      get: async () => data,
    });

    await summaryRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("fetches analytics summary with date range", async () => {
    const data = sampleAnalytics();
    let gotParams: Record<string, string> | undefined;
    const { ctx, output } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return data;
      },
    });

    await summaryRun(["--zone", ZONE_ID, "--from", "2024-01-01", "--to", "2024-06-01"], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(gotParams?.since).toBe("2024-01-01");
    expect(gotParams?.until).toBe("2024-06-01");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(summaryRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Analytics Bytes ─────────────────────────────────────────────────────

describe("spectrum analytics bytes", () => {
  test("fetches byte analytics", async () => {
    const data = sampleAnalytics();
    const { ctx, output } = createTestContext({
      get: async () => data,
    });

    await bytesRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("fetches byte analytics with date range", async () => {
    const data = sampleAnalytics();
    let gotParams: Record<string, string> | undefined;
    const { ctx, output } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return data;
      },
    });

    await bytesRun(["--zone", ZONE_ID, "--from", "2024-01-01", "--to", "2024-06-01"], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(gotParams?.since).toBe("2024-01-01");
    expect(gotParams?.until).toBe("2024-06-01");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(bytesRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── API Path Verification ──────────────────────────────────────────────

describe("spectrum API path verification", () => {
  test("spectrum app list calls correct API path", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return [];
      },
    });

    await appListRun(["--zone", ZONE_ID], ctx);

    expect(calledPath).toContain("/spectrum/apps");
    expect(calledPath).toContain(ZONE_ID);
  });

  test("spectrum app get calls correct API path", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleSpectrumApp();
      },
    });

    await appGetRun(["--zone", ZONE_ID, "--id", APP_ID], ctx);

    expect(calledPath).toContain(`/spectrum/apps/${APP_ID}`);
  });

  test("analytics summary calls correct API path", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleAnalytics();
      },
    });

    await summaryRun(["--zone", ZONE_ID], ctx);

    expect(calledPath).toContain("/spectrum/analytics/aggregate/current");
  });

  test("analytics bytes calls correct API path", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleAnalytics();
      },
    });

    await bytesRun(["--zone", ZONE_ID], ctx);

    expect(calledPath).toContain("/spectrum/analytics/events/bytime");
  });

  test("spectrum app delete calls correct API path", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      delete: async (path: string) => {
        calledPath = path;
        return {};
      },
    });

    await appDeleteRun(["--zone", ZONE_ID, "--id", APP_ID], ctx);

    expect(calledPath).toContain(`/spectrum/apps/${APP_ID}`);
  });
});
