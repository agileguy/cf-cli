import { describe, test, expect } from "bun:test";
import { createTestContext, sampleAccount } from "../helpers.js";

import { run as listRun } from "../../src/commands/accounts/list.js";
import { run as getRun } from "../../src/commands/accounts/get.js";
import { run as routerRun } from "../../src/commands/accounts/index.js";

describe("accounts list", () => {
  test("lists accounts", async () => {
    const accounts = [sampleAccount(), sampleAccount({ id: "bbb", name: "Second Account" })];
    const { ctx, output } = createTestContext({
      get: async () => accounts,
    });

    await listRun([], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("passes pagination params", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        capturedParams = params;
        return [];
      },
    });

    await listRun(["--page", "3", "--per-page", "25"], ctx);

    expect(capturedParams!["page"]).toBe("3");
    expect(capturedParams!["per_page"]).toBe("25");
  });

  test("uses fetchAll with --all", async () => {
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
});

describe("accounts get", () => {
  test("gets account details", async () => {
    const account = sampleAccount();
    const { ctx, output } = createTestContext({
      get: async () => account,
    });

    await getRun(["--id", "abc123def456abc123def456abc12345"], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("Test Account");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(getRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("accounts router", () => {
  test("routes to list", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["list"], ctx);
    expect(output.captured.tables.length + output.captured.infos.length).toBeGreaterThanOrEqual(1);
  });

  test("shows help", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});
