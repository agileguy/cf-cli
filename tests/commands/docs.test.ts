import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";
import { run as docsRun, TOPICS, formatMarkdownForTerminal } from "../../src/commands/docs/index.js";

describe("cf docs", () => {
  test("shows topic list when run with no arguments", async () => {
    const { ctx, output } = createTestContext();
    await docsRun([], ctx);

    expect(output.captured.tables.length).toBeGreaterThanOrEqual(1);
    const table = output.captured.tables[0];
    expect(table?.data.length).toBe(TOPICS.length);
  });

  test("shows topic list for 'list' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await docsRun(["list"], ctx);

    expect(output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("renders documentation for a valid topic", async () => {
    const { ctx } = createTestContext();
    let captured = "";
    const origWrite = process.stdout.write;
    // Capture stdout
    process.stdout.write = ((chunk: string) => {
      captured += chunk;
      return true;
    }) as unknown as typeof process.stdout.write;

    try {
      await docsRun(["dns", "--no-pager"], ctx);
    } finally {
      process.stdout.write = origWrite;
    }

    expect(captured).toContain("DNS");
    expect(captured).toContain("cf dns");
  });

  test("warns and shows list on unknown topic", async () => {
    const { ctx, output } = createTestContext();
    await docsRun(["nonexistent-topic"], ctx);

    expect(output.captured.warnings.length).toBeGreaterThanOrEqual(1);
    expect(output.captured.warnings[0]).toContain("Unknown documentation topic");
    expect(output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("searches across documentation with 'search' command", async () => {
    const { ctx, output } = createTestContext();
    let captured = "";
    const origWrite = process.stdout.write;
    process.stdout.write = ((chunk: string) => {
      captured += chunk;
      return true;
    }) as unknown as typeof process.stdout.write;

    try {
      await docsRun(["search", "TTL"], ctx);
    } finally {
      process.stdout.write = origWrite;
    }

    expect(output.captured.infos.length).toBeGreaterThanOrEqual(1);
    expect(output.captured.infos[0]).toContain("Found");
    expect(captured).toContain("dns");
  });

  test("throws UsageError when search query is missing", async () => {
    const { ctx } = createTestContext();
    expect(docsRun(["search"], ctx)).rejects.toThrow("Search query required");
  });

  test("formatMarkdownForTerminal properly styles markdown", () => {
    const md = "# Title\n## Section\n`code` and **bold**\n> quote";
    const formatted = formatMarkdownForTerminal(md);
    expect(formatted).toContain("TITLE");
    expect(formatted).toContain("SECTION");
  });
});
