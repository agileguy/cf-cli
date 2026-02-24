import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { createTestContext } from "../helpers.js";

import { run as listRun } from "../../src/commands/config/list.js";
import { run as useRun } from "../../src/commands/config/use.js";
import { run as routerRun } from "../../src/commands/config/index.js";

// Note: set, get, and delete commands write to disk. We test the router
// and the simpler commands that can work with mock context.

describe("config list", () => {
  test("shows info when no profiles configured", async () => {
    const { ctx, output } = createTestContext();
    // ctx.config has empty profiles by default from createTestContext

    await listRun([], ctx);

    expect(output.captured.infos).toHaveLength(1);
    expect(output.captured.infos[0]).toContain("No profiles");
  });
});

describe("config use", () => {
  test("throws when no profile name provided", async () => {
    const { ctx } = createTestContext();
    expect(useRun([], ctx)).rejects.toThrow("Usage: cf config use");
  });
});

describe("config router", () => {
  test("routes to list", async () => {
    const { ctx, output } = createTestContext();
    await routerRun(["list"], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes aliases", async () => {
    const { ctx, output } = createTestContext();
    await routerRun(["ls"], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown config command");
  });
});
