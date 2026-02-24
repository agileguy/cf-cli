import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as listRun } from "../../src/commands/page-rules/list.js";
import { run as getRun } from "../../src/commands/page-rules/get.js";
import { run as createRun } from "../../src/commands/page-rules/create.js";
import { run as updateRun } from "../../src/commands/page-rules/update.js";
import { run as deleteRun } from "../../src/commands/page-rules/delete.js";
import { run as routerRun } from "../../src/commands/page-rules/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";

function samplePageRule(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "pr-uuid-123",
    targets: [
      { target: "url", constraint: { operator: "matches", value: "*.example.com/api/*" } },
    ],
    actions: [
      { id: "forwarding_url", value: { url: "https://example.com", status_code: 301 } },
    ],
    priority: 1,
    status: "active",
    created_on: "2024-01-01T00:00:00.000Z",
    modified_on: "2024-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("page-rules list", () => {
  test("lists page rules", async () => {
    const rules = [samplePageRule(), samplePageRule({ id: "pr-2", priority: 2 })];
    const { ctx, output } = createTestContext({
      get: async () => rules,
    });

    await listRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(listRun([], ctx)).rejects.toThrow("--zone");
  });

  test("resolves zone name to ID", async () => {
    let capturedPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        capturedPath = path;
        if (path === "/zones") return [{ id: ZONE_ID }];
        return [];
      },
    });

    await listRun(["--zone", "example.com"], ctx);

    expect(capturedPath).toContain(ZONE_ID);
  });
});

describe("page-rules get", () => {
  test("gets page rule details", async () => {
    const rule = samplePageRule();
    const { ctx, output } = createTestContext({
      get: async () => rule,
    });

    await getRun(["--zone", ZONE_ID, "--id", "pr-uuid-123"], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Target"]).toBe("*.example.com/api/*");
    expect(output.captured.details[0]!["Status"]).toBe("active");
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(getRun(["--id", "abc"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(getRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("page-rules create", () => {
  test("creates a page rule from file", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = createTestContext({
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return samplePageRule();
      },
    });

    // Create a temp file for the test
    const tmpFile = "/tmp/test-pagerule.json";
    await Bun.write(tmpFile, JSON.stringify({
      targets: [{ target: "url", constraint: { operator: "matches", value: "*.example.com/*" } }],
      actions: [{ id: "forwarding_url", value: { url: "https://new.example.com", status_code: 301 } }],
    }));

    await createRun(["--zone", ZONE_ID, "--file", tmpFile], ctx);

    expect(capturedPath).toContain(ZONE_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(capturedBody).toBeDefined();
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(createRun(["--file", "/tmp/test.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(createRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws on non-existent file", async () => {
    const { ctx } = createTestContext();
    expect(createRun(["--zone", ZONE_ID, "--file", "/tmp/nonexistent-file-xyz.json"], ctx)).rejects.toThrow("Cannot read file");
  });
});

describe("page-rules update", () => {
  test("updates a page rule from file", async () => {
    let capturedPath = "";
    const { ctx, output } = createTestContext({
      put: async (path: string) => {
        capturedPath = path;
        return samplePageRule();
      },
    });

    const tmpFile = "/tmp/test-pagerule-update.json";
    await Bun.write(tmpFile, JSON.stringify({
      targets: [{ target: "url", constraint: { operator: "matches", value: "*.example.com/*" } }],
      actions: [{ id: "forwarding_url", value: { url: "https://updated.example.com", status_code: 302 } }],
    }));

    await updateRun(["--zone", ZONE_ID, "--id", "pr-uuid-123", "--file", tmpFile], ctx);

    expect(capturedPath).toContain("pr-uuid-123");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--zone", ZONE_ID, "--file", "/tmp/test.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--zone", ZONE_ID, "--id", "abc"], ctx)).rejects.toThrow("--file");
  });
});

describe("page-rules delete", () => {
  test("deletes page rule with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return { id: "pr-uuid-123" };
      },
    });

    await deleteRun(["--zone", ZONE_ID, "--id", "pr-uuid-123"], ctx);

    expect(deletedPath).toContain("pr-uuid-123");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await deleteRun(["--zone", ZONE_ID, "--id", "pr-uuid-123"], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(deleteRun(["--id", "abc"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(deleteRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("page-rules router", () => {
  test("routes to list", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["list", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes with aliases", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["ls", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown page-rules command");
  });
});
