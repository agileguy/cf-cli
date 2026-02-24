import { describe, test, expect } from "bun:test";
import { createTestContext, sampleZone } from "../helpers.js";

import { run as listRun } from "../../src/commands/zones/list.js";
import { run as getRun } from "../../src/commands/zones/get.js";
import { run as createRun } from "../../src/commands/zones/create.js";
import { run as deleteRun } from "../../src/commands/zones/delete.js";
import { run as routerRun } from "../../src/commands/zones/index.js";

describe("zones list", () => {
  test("lists zones from API", async () => {
    const zones = [sampleZone(), sampleZone({ id: "bbb12345bbb12345bbb12345bbb12345", name: "test.com" })];
    const { ctx, output } = createTestContext({
      get: async () => zones,
    });

    await listRun([], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("passes filters to API", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        capturedParams = params;
        return [];
      },
    });

    await listRun(["--name", "example.com", "--status", "active"], ctx);

    expect(capturedParams).toBeDefined();
    expect(capturedParams!["name"]).toBe("example.com");
    expect(capturedParams!["status"]).toBe("active");
  });

  test("uses fetchAll when --all flag is set", async () => {
    let fetchAllCalled = false;
    const { ctx } = createTestContext({
      fetchAll: async () => {
        fetchAllCalled = true;
        return [];
      },
    });

    await listRun(["--all"], ctx);

    expect(fetchAllCalled).toBe(true);
  });

  test("passes pagination params", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        capturedParams = params;
        return [];
      },
    });

    await listRun(["--page", "2", "--per-page", "10"], ctx);

    expect(capturedParams!["page"]).toBe("2");
    expect(capturedParams!["per_page"]).toBe("10");
  });
});

describe("zones get", () => {
  test("gets zone by ID", async () => {
    const zone = sampleZone();
    const { ctx, output } = createTestContext({
      get: async () => zone,
    });

    await getRun(["--id", "023e105f4ecef8ad9ca31a8372d0c353"], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe("023e105f4ecef8ad9ca31a8372d0c353");
  });

  test("gets zone by name (resolves ID first)", async () => {
    const zone = sampleZone();
    let callCount = 0;
    const { ctx, output } = createTestContext({
      get: async (path: string) => {
        callCount++;
        if (path === "/zones") {
          // Zone name resolution call
          return [{ id: "023e105f4ecef8ad9ca31a8372d0c353" }];
        }
        return zone;
      },
    });

    await getRun(["--name", "example.com"], ctx);

    expect(callCount).toBe(2); // resolve + get
    expect(output.captured.details).toHaveLength(1);
  });

  test("throws when neither --id nor --name provided", async () => {
    const { ctx } = createTestContext();

    expect(getRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("zones create", () => {
  test("creates a zone", async () => {
    const zone = sampleZone();
    let capturedBody: unknown;
    const { ctx, output } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return zone;
      },
    });

    await createRun(["--name", "example.com", "--account-id", "abc123"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("created");
    expect((capturedBody as Record<string, unknown>)["name"]).toBe("example.com");
  });

  test("throws when --name missing", async () => {
    const { ctx } = createTestContext();
    expect(createRun(["--account-id", "abc123"], ctx)).rejects.toThrow("--name");
  });

  test("throws when --account-id missing", async () => {
    const { ctx } = createTestContext();
    expect(createRun(["--name", "example.com"], ctx)).rejects.toThrow("--account-id");
  });

  test("includes jump-start flag", async () => {
    let capturedBody: unknown;
    const { ctx } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleZone();
      },
    });

    await createRun(["--name", "example.com", "--account-id", "abc123", "--jump-start"], ctx);

    expect((capturedBody as Record<string, unknown>)["jump_start"]).toBe(true);
  });
});

describe("zones delete", () => {
  test("deletes zone with --yes flag", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return { id: "abc123" };
      },
    });

    await deleteRun(["--id", "023e105f4ecef8ad9ca31a8372d0c353"], ctx);

    expect(deletedPath).toBe("/zones/023e105f4ecef8ad9ca31a8372d0c353");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation is denied (non-TTY)", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });
    // Non-TTY stdin defaults to false for confirm

    await deleteRun(["--id", "023e105f4ecef8ad9ca31a8372d0c353"], ctx);

    expect(output.captured.infos).toHaveLength(1);
    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(deleteRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("zones router", () => {
  test("routes to list", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });

    await routerRun(["list"], ctx);

    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("shows help for unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown zones command");
  });

  test("shows help with no subcommand", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});
