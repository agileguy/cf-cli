import { describe, test, expect, spyOn } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as routerRun } from "../../src/commands/snippets/index.js";
import { run as listRun } from "../../src/commands/snippets/list.js";
import { run as getRun } from "../../src/commands/snippets/get.js";
import { run as deleteRun } from "../../src/commands/snippets/delete.js";
import { run as rulesRun } from "../../src/commands/snippets/rules/index.js";

const prompts = await import("../../src/utils/prompts.js");

const sampleSnippet = () => ({
  snippet_name: "my-snippet",
  main_module: "my-snippet",
  created_on: "2024-01-01T00:00:00.000Z",
  modified_on: "2024-06-01T00:00:00.000Z",
});

const sampleSnippetRule = () => ({
  snippet_name: "my-snippet",
  expression: "http.host eq \"example.com\"",
  description: "Route to snippet",
  enabled: true,
});

// Helper: zone lookup mock
const zoneGet = (returnVal: unknown) => async (path: string) => {
  if (path === "/zones") return [{ id: "zone-id-123", name: "example.com" }];
  return returnVal;
};

// ─── Router ────────────────────────────────────────────────────────────────

describe("snippets router", () => {
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

// ─── Snippets CRUD ─────────────────────────────────────────────────────────

describe("snippets list", () => {
  test("requires --zone", async () => {
    const { ctx } = createTestContext();
    expect(listRun([], ctx)).rejects.toThrow("--zone");
  });

  test("returns table", async () => {
    const { ctx, output } = createTestContext({ get: zoneGet([sampleSnippet()]) });
    await listRun(["--zone", "example.com"], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });
});

describe("snippets get", () => {
  test("requires --zone and --name", async () => {
    const { ctx } = createTestContext();
    expect(getRun([], ctx)).rejects.toThrow("--zone");
    const { ctx: ctx2 } = createTestContext({ get: zoneGet({}) });
    expect(getRun(["--zone", "example.com"], ctx2)).rejects.toThrow("--name");
  });

  test("returns details", async () => {
    const { ctx, output } = createTestContext({ get: zoneGet(sampleSnippet()) });
    await getRun(["--zone", "example.com", "--name", "my-snippet"], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-snippet");
  });
});

describe("snippets delete", () => {
  test("requires --zone and --name", async () => {
    const { ctx } = createTestContext();
    expect(deleteRun([], ctx)).rejects.toThrow("--zone");
    const { ctx: ctx2 } = createTestContext({ get: zoneGet({}) });
    expect(deleteRun(["--zone", "example.com"], ctx2)).rejects.toThrow("--name");
  });

  test("aborts without confirmation", async () => {
    const spy = spyOn(prompts, "confirm").mockResolvedValue(false);
    const { ctx, output } = createTestContext(
      { get: zoneGet({}), delete: async () => ({}) },
      { yes: undefined },
    );
    await deleteRun(["--zone", "example.com", "--name", "my-snippet"], ctx);
    expect(output.captured.warnings[0]).toContain("Aborted");
    spy.mockRestore();
  });

  test("deletes with confirmation", async () => {
    const { ctx, output } = createTestContext({
      get: zoneGet({}),
      delete: async () => ({}),
    });
    await deleteRun(["--zone", "example.com", "--name", "my-snippet"], ctx);
    expect(output.captured.successes[0]).toContain("deleted");
  });
});

// ─── Snippet Rules ─────────────────────────────────────────────────────────

describe("snippets rules", () => {
  test("shows help", async () => {
    const { ctx, output } = createTestContext();
    await rulesRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("list requires --zone", async () => {
    const { ctx } = createTestContext();
    expect(rulesRun(["list"], ctx)).rejects.toThrow("--zone");
  });

  test("list returns table", async () => {
    const { ctx, output } = createTestContext({ get: zoneGet([sampleSnippetRule()]) });
    await rulesRun(["list", "--zone", "example.com"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("upsert requires --zone and --file", async () => {
    const { ctx } = createTestContext();
    expect(rulesRun(["upsert"], ctx)).rejects.toThrow("--zone");
    const { ctx: ctx2 } = createTestContext({ get: zoneGet({}) });
    expect(rulesRun(["upsert", "--zone", "example.com"], ctx2)).rejects.toThrow("--file");
  });
});
