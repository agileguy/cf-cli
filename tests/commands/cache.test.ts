import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as purgeRun } from "../../src/commands/cache/purge.js";
import { run as routerRun } from "../../src/commands/cache/index.js";

describe("cache purge", () => {
  test("purges everything", async () => {
    let capturedBody: unknown;
    const { ctx, output } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { id: "purge123" };
      },
    });

    await purgeRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--everything",
    ], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect((capturedBody as Record<string, unknown>)["purge_everything"]).toBe(true);
  });

  test("purges specific URLs", async () => {
    let capturedBody: unknown;
    const { ctx, output } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { id: "purge123" };
      },
    });

    await purgeRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--urls", "https://example.com/a,https://example.com/b",
    ], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect((capturedBody as Record<string, unknown>)["files"]).toEqual([
      "https://example.com/a",
      "https://example.com/b",
    ]);
  });

  test("purges by tags", async () => {
    let capturedBody: unknown;
    const { ctx } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { id: "purge123" };
      },
    });

    await purgeRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--tags", "tag1,tag2",
    ], ctx);

    expect((capturedBody as Record<string, unknown>)["tags"]).toEqual(["tag1", "tag2"]);
  });

  test("purges by hosts", async () => {
    let capturedBody: unknown;
    const { ctx } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { id: "purge123" };
      },
    });

    await purgeRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--hosts", "example.com,www.example.com",
    ], ctx);

    expect((capturedBody as Record<string, unknown>)["hosts"]).toEqual(["example.com", "www.example.com"]);
  });

  test("purges by prefixes", async () => {
    let capturedBody: unknown;
    const { ctx } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { id: "purge123" };
      },
    });

    await purgeRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--prefixes", "example.com/images/,example.com/static/",
    ], ctx);

    expect((capturedBody as Record<string, unknown>)["prefixes"]).toEqual([
      "example.com/images/",
      "example.com/static/",
    ]);
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(purgeRun(["--everything"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when no purge option provided", async () => {
    const { ctx } = createTestContext();
    expect(purgeRun(["--zone", "abc"], ctx)).rejects.toThrow("Specify one of");
  });

  test("throws when multiple purge options provided", async () => {
    const { ctx } = createTestContext();
    expect(purgeRun([
      "--zone", "abc",
      "--everything",
      "--urls", "https://example.com/a",
    ], ctx)).rejects.toThrow("mutually exclusive");
  });

  test("throws when more than 30 URLs provided", async () => {
    const { ctx } = createTestContext();
    const urls = Array.from({ length: 31 }, (_, i) => `https://example.com/${i}`).join(",");
    expect(purgeRun([
      "--zone", "abc",
      "--urls", urls,
    ], ctx)).rejects.toThrow("Maximum 30 URLs");
  });

  test("aborts everything purge without confirmation", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await purgeRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--everything",
    ], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

describe("cache router", () => {
  test("routes to purge", async () => {
    const { ctx, output } = createTestContext({
      post: async () => ({ id: "purge123" }),
    });
    await routerRun(["purge", "--zone", "023e105f4ecef8ad9ca31a8372d0c353", "--everything"], ctx);
    expect(output.captured.successes).toHaveLength(1);
  });

  test("shows help", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});
