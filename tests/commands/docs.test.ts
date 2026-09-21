import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";
import { run as docsRun, TOPICS, formatMarkdownForTerminal } from "../../src/commands/docs/index.js";
import { OutputFormatterImpl } from "../../src/output.js";
import type { ColumnDef } from "../../src/types/index.js";

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

  // The table renderer caps a column's width but pads rows without cutting
  // them, so any topic whose title or description outgrows its column pushes
  // that row past the border. Rendering the real column definitions through
  // the real formatter is what catches a new long topic reintroducing it.
  test("the topic list renders as an aligned table", async () => {
    const { ctx, output } = createTestContext();
    await docsRun(["list"], ctx);

    const table = output.captured.tables[0];
    expect(table).toBeDefined();

    let captured = "";
    const origWrite = process.stdout.write;
    process.stdout.write = ((chunk: string) => {
      captured += chunk;
      return true;
    }) as unknown as typeof process.stdout.write;

    try {
      new OutputFormatterImpl({}).table(table!.data, table!.columns as ColumnDef[]);
    } finally {
      process.stdout.write = origWrite;
    }

    const boxRows = captured
      // eslint-disable-next-line no-control-regex
      .replace(/\[[0-9;]*m/g, "")
      .split("\n")
      .filter((l) => /^[┌│├└]/.test(l));

    expect(boxRows.length).toBe(TOPICS.length + 4); // top, header, rule, rows, bottom
    const widths = new Set(boxRows.map((l) => [...l].length));
    expect([...widths]).toHaveLength(1);
  });
});
