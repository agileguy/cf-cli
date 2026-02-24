import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Healthcheck command runners
import { run as listRun } from "../../src/commands/healthchecks/list.js";
import { run as getRun } from "../../src/commands/healthchecks/get.js";
import { run as createRun } from "../../src/commands/healthchecks/create.js";
import { run as updateRun } from "../../src/commands/healthchecks/update.js";
import { run as deleteRun } from "../../src/commands/healthchecks/delete.js";
import { run as previewRun } from "../../src/commands/healthchecks/preview.js";

// Router
import { run as mainRouterRun } from "../../src/commands/healthchecks/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";
const HC_ID = "hc-uuid-123";

function sampleHealthcheck(overrides: Record<string, unknown> = {}) {
  return {
    id: HC_ID,
    name: "api-health",
    address: "api.example.com",
    type: "HTTP",
    status: "healthy",
    suspended: false,
    interval: 60,
    timeout: 5,
    retries: 2,
    check_regions: ["WNAM", "ENAM"],
    http_config: {
      method: "GET",
      path: "/health",
      expected_codes: ["200"],
    },
    created_on: "2024-01-01T00:00:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

// ─── Healthchecks Router ────────────────────────────────────────────────

describe("healthchecks main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown healthchecks command");
  });

  test("routes 'list' subcommand", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await mainRouterRun(["list", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables.length + output.captured.infos.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Healthchecks List ──────────────────────────────────────────────────

describe("healthchecks list", () => {
  test("lists healthchecks", async () => {
    const hcs = [sampleHealthcheck(), sampleHealthcheck({ id: "hc-2", name: "db-health" })];
    const { ctx, output } = createTestContext({
      get: async () => hcs,
    });

    await listRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(listRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Healthchecks Get ───────────────────────────────────────────────────

describe("healthchecks get", () => {
  test("gets a healthcheck by ID", async () => {
    const hc = sampleHealthcheck();
    const { ctx, output } = createTestContext({
      get: async () => hc,
    });

    await getRun(["--zone", ZONE_ID, "--id", HC_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("api-health");
    expect(output.captured.details[0]!["Address"]).toBe("api.example.com");
    expect(output.captured.details[0]!["Status"]).toBe("healthy");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(getRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(getRun(["--id", HC_ID], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Healthchecks Create ────────────────────────────────────────────────

describe("healthchecks create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(createRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(createRun(["--file", "hc.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = createTestContext();
    expect(createRun(["--zone", ZONE_ID, "--file", "/tmp/nonexistent-cf-cli-hc.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Healthchecks Update ────────────────────────────────────────────────

describe("healthchecks update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--zone", ZONE_ID, "--file", "hc.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--zone", ZONE_ID, "--id", HC_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--zone", ZONE_ID, "--id", HC_ID, "--file", "/tmp/nonexistent-cf-cli-hc.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Healthchecks Delete ────────────────────────────────────────────────

describe("healthchecks delete", () => {
  test("deletes a healthcheck with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await deleteRun(["--zone", ZONE_ID, "--id", HC_ID], ctx);

    expect(deletedPath).toContain(HC_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await deleteRun(["--zone", ZONE_ID, "--id", HC_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(deleteRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(deleteRun(["--id", HC_ID], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Healthchecks Preview ───────────────────────────────────────────────

describe("healthchecks preview", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(previewRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(previewRun(["--file", "hc.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = createTestContext();
    expect(previewRun(["--zone", ZONE_ID, "--file", "/tmp/nonexistent-cf-cli-hc-preview.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});
