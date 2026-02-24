import { describe, test, expect, spyOn } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as routerRun } from "../../src/commands/rules-lists/index.js";
import { run as listRun } from "../../src/commands/rules-lists/list.js";
import { run as getRun } from "../../src/commands/rules-lists/get.js";
import { run as createRun } from "../../src/commands/rules-lists/create.js";
import { run as updateRun } from "../../src/commands/rules-lists/update.js";
import { run as deleteRun } from "../../src/commands/rules-lists/delete.js";
import { run as itemsRouterRun } from "../../src/commands/rules-lists/items/index.js";
import { run as itemsListRun } from "../../src/commands/rules-lists/items/list.js";
import { run as itemsDeleteRun } from "../../src/commands/rules-lists/items/delete.js";

const prompts = await import("../../src/utils/prompts.js");

const sampleList = () => ({
  id: "list-uuid-123",
  name: "blocked-ips",
  kind: "ip",
  description: "Blocked IPs",
  num_items: 10,
  num_referencing_filters: 2,
  created_on: "2024-01-01T00:00:00.000Z",
  modified_on: "2024-06-01T00:00:00.000Z",
});

const sampleItem = () => ({
  id: "item-uuid-123",
  ip: "192.0.2.1",
  comment: "Bad actor",
  created_on: "2024-01-01T00:00:00.000Z",
  modified_on: "2024-06-01T00:00:00.000Z",
});

// Helper: account lookup mock
const accountGet = (returnVal: unknown) => async (path: string) => {
  if (path === "/accounts") return [{ id: "acct-123", name: "Test" }];
  return returnVal;
};

// ─── Router ────────────────────────────────────────────────────────────────

describe("rules-lists router", () => {
  test("shows help", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("unknown command throws", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown");
  });
});

// ─── Lists CRUD ────────────────────────────────────────────────────────────

describe("rules-lists list", () => {
  test("returns table", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet([sampleList()]),
    });
    await listRun(["--account-id", "acct-123"], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });
});

describe("rules-lists get", () => {
  test("returns details", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet(sampleList()),
    });
    await getRun(["--account-id", "acct-123", "--id", "list-uuid-123"], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("blocked-ips");
  });

  test("requires --id", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(getRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--id");
  });
});

describe("rules-lists create", () => {
  test("requires --name and --kind", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(createRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--name");
    expect(createRun(["--account-id", "acct-123", "--name", "test"], ctx)).rejects.toThrow("--kind");
  });

  test("creates list successfully", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [{ id: "acct-123" }],
      post: async () => sampleList(),
    });
    await createRun(["--account-id", "acct-123", "--name", "blocked-ips", "--kind", "ip"], ctx);
    expect(output.captured.successes[0]).toContain("created");
    expect(output.captured.details[0]!["Kind"]).toBe("ip");
  });
});

describe("rules-lists update", () => {
  test("requires --id", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(updateRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--id");
  });

  test("updates list successfully", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [{ id: "acct-123" }],
      put: async () => sampleList(),
    });
    await updateRun(["--account-id", "acct-123", "--id", "list-1", "--description", "Updated"], ctx);
    expect(output.captured.successes[0]).toContain("updated");
  });
});

describe("rules-lists delete", () => {
  test("requires --id", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(deleteRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--id");
  });

  test("aborts without confirmation", async () => {
    const spy = spyOn(prompts, "confirm").mockResolvedValue(false);
    const { ctx, output } = createTestContext(
      { get: accountGet({}), delete: async () => ({}) },
      { yes: undefined },
    );
    await deleteRun(["--account-id", "acct-123", "--id", "list-1"], ctx);
    expect(output.captured.warnings[0]).toContain("Aborted");
    spy.mockRestore();
  });

  test("deletes with confirmation", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet({}),
      delete: async () => ({}),
    });
    await deleteRun(["--account-id", "acct-123", "--id", "list-1"], ctx);
    expect(output.captured.successes[0]).toContain("deleted");
  });
});

// ─── Items ─────────────────────────────────────────────────────────────────

describe("rules-lists items router", () => {
  test("shows help", async () => {
    const { ctx, output } = createTestContext();
    await itemsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("rules-lists items list", () => {
  test("requires --list", async () => {
    const { ctx } = createTestContext({ get: accountGet([]) });
    expect(itemsListRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--list");
  });

  test("returns table", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet([sampleItem()]),
    });
    await itemsListRun(["--account-id", "acct-123", "--list", "list-1"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });
});

describe("rules-lists items delete", () => {
  test("requires --list and --ids", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(itemsDeleteRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--list");
    expect(itemsDeleteRun(["--account-id", "acct-123", "--list", "list-1"], ctx)).rejects.toThrow("--ids");
  });

  test("aborts without confirmation", async () => {
    const spy = spyOn(prompts, "confirm").mockResolvedValue(false);
    const { ctx, output } = createTestContext(
      { get: accountGet({}), delete: async () => ({}) },
      { yes: undefined },
    );
    await itemsDeleteRun(["--account-id", "acct-123", "--list", "list-1", "--ids", "i1,i2"], ctx);
    expect(output.captured.warnings[0]).toContain("Aborted");
    spy.mockRestore();
  });

  test("deletes items with confirmation", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet({}),
      delete: async () => ({}),
    });
    await itemsDeleteRun(["--account-id", "acct-123", "--list", "list-1", "--ids", "i1,i2"], ctx);
    expect(output.captured.successes[0]).toContain("deleted");
  });
});
