import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { OutputFormatterImpl } from "../src/output.js";
import { setNoColor } from "../src/utils/colors.js";
import type { GlobalFlags, ColumnDef } from "../src/types/index.js";

/** Capture stdout writes */
function captureStdout(fn: () => void): string {
  const writes: string[] = [];
  const original = process.stdout.write;
  process.stdout.write = ((chunk: unknown) => {
    writes.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;

  fn();

  process.stdout.write = original;
  return writes.join("");
}

/** Capture stderr writes */
function captureStderr(fn: () => void): string {
  const writes: string[] = [];
  const original = process.stderr.write;
  process.stderr.write = ((chunk: unknown) => {
    writes.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;

  fn();

  process.stderr.write = original;
  return writes.join("");
}

describe("OutputFormatterImpl", () => {
  // Disable colors for consistent test output
  beforeEach(() => {
    setNoColor(true);
  });

  afterEach(() => {
    setNoColor(false);
  });

  const defaultFlags: GlobalFlags = {};
  const quietFlags: GlobalFlags = { quiet: true };

  describe("json", () => {
    test("outputs pretty-printed JSON", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.json({ id: "123", name: "example.com" });
      });

      const parsed = JSON.parse(output);
      expect(parsed.id).toBe("123");
      expect(parsed.name).toBe("example.com");
      expect(output).toContain("  "); // 2-space indentation
    });

    test("handles arrays", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.json([{ id: "1" }, { id: "2" }]);
      });

      const parsed = JSON.parse(output);
      expect(parsed).toHaveLength(2);
    });

    test("suppressed in quiet mode", () => {
      const out = new OutputFormatterImpl(quietFlags);
      const output = captureStdout(() => {
        out.json({ id: "123" });
      });

      expect(output).toBe("");
    });
  });

  describe("csv", () => {
    const columns: ColumnDef[] = [
      { key: "id", header: "ID" },
      { key: "name", header: "Name" },
      { key: "status", header: "Status" },
    ];

    test("outputs CSV with headers", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.csv(
          [
            { id: "1", name: "example.com", status: "active" },
            { id: "2", name: "test.com", status: "pending" },
          ],
          columns,
        );
      });

      const lines = output.trim().split("\n");
      expect(lines[0]).toBe("ID,Name,Status");
      expect(lines[1]).toBe("1,example.com,active");
      expect(lines[2]).toBe("2,test.com,pending");
    });

    test("escapes commas and quotes in CSV values", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.csv(
          [{ id: "1", name: 'has, comma and "quotes"', status: "ok" }],
          columns,
        );
      });

      const lines = output.trim().split("\n");
      expect(lines[1]).toContain('"has, comma and ""quotes"""');
    });

    test("suppressed in quiet mode", () => {
      const out = new OutputFormatterImpl(quietFlags);
      const output = captureStdout(() => {
        out.csv([{ id: "1" }], columns);
      });

      expect(output).toBe("");
    });
  });

  describe("table", () => {
    const columns: ColumnDef[] = [
      { key: "id", header: "ID" },
      { key: "name", header: "Name" },
    ];

    test("renders a table with box-drawing characters", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.table(
          [
            { id: "abc", name: "example.com" },
            { id: "def", name: "test.org" },
          ],
          columns,
        );
      });

      // Should contain box-drawing chars
      expect(output).toContain("\u250c"); // top-left
      expect(output).toContain("\u2502"); // vertical
      expect(output).toContain("\u2500"); // horizontal
      expect(output).toContain("\u2518"); // bottom-right
      // Should contain data
      expect(output).toContain("abc");
      expect(output).toContain("example.com");
      expect(output).toContain("def");
      expect(output).toContain("test.org");
      // Should contain headers
      expect(output).toContain("ID");
      expect(output).toContain("Name");
    });

    test("shows info message for empty data", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStderr(() => {
        out.table([], columns);
      });

      expect(output).toContain("No results found");
    });

    test("handles nested keys with dot notation", () => {
      const nestedColumns: ColumnDef[] = [
        { key: "account.name", header: "Account" },
        { key: "name", header: "Zone" },
      ];

      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.table(
          [{ name: "example.com", account: { name: "My Account" } }],
          nestedColumns,
        );
      });

      expect(output).toContain("My Account");
      expect(output).toContain("example.com");
    });

    test("applies transform function", () => {
      const cols: ColumnDef[] = [
        {
          key: "status",
          header: "Status",
          transform: (v: unknown) => String(v).toUpperCase(),
        },
      ];

      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.table([{ status: "active" }], cols);
      });

      expect(output).toContain("ACTIVE");
    });

    test("suppressed in quiet mode", () => {
      const out = new OutputFormatterImpl(quietFlags);
      const output = captureStdout(() => {
        out.table([{ id: "1" }], columns);
      });

      expect(output).toBe("");
    });
  });

  describe("yaml", () => {
    test("outputs simple key-value YAML", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.yaml({ name: "example.com", status: "active", ttl: 300 });
      });

      expect(output).toContain("name: example.com");
      expect(output).toContain("status: active");
      expect(output).toContain("ttl: 300");
    });

    test("handles nested objects", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.yaml({ zone: { name: "example.com", plan: { name: "Free" } } });
      });

      expect(output).toContain("zone:");
      expect(output).toContain("name: example.com");
      expect(output).toContain("plan:");
      expect(output).toContain("name: Free");
    });

    test("handles arrays", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.yaml({ items: ["a", "b", "c"] });
      });

      expect(output).toContain("items:");
      expect(output).toContain("- a");
      expect(output).toContain("- b");
      expect(output).toContain("- c");
    });

    test("handles null and booleans", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.yaml({ active: true, paused: false, owner: null });
      });

      expect(output).toContain("active: true");
      expect(output).toContain("paused: false");
      expect(output).toContain("owner: null");
    });
  });

  describe("success/error/warn/info", () => {
    test("success outputs checkmark", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.success("Operation complete");
      });

      expect(output).toContain("\u2713");
      expect(output).toContain("Operation complete");
    });

    test("error outputs X mark to stderr", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStderr(() => {
        out.error("Something failed");
      });

      expect(output).toContain("\u2717");
      expect(output).toContain("Something failed");
    });

    test("error always outputs even in quiet mode", () => {
      const out = new OutputFormatterImpl(quietFlags);
      const output = captureStderr(() => {
        out.error("Critical failure");
      });

      expect(output).toContain("Critical failure");
    });

    test("warn outputs to stderr", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStderr(() => {
        out.warn("Caution advised");
      });

      expect(output).toContain("!");
      expect(output).toContain("Caution advised");
    });

    test("info outputs to stderr", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStderr(() => {
        out.info("FYI");
      });

      expect(output).toContain("\u2139");
      expect(output).toContain("FYI");
    });

    test("success/warn/info suppressed in quiet mode", () => {
      const out = new OutputFormatterImpl(quietFlags);
      const stdout = captureStdout(() => {
        out.success("suppressed");
      });
      const stderr = captureStderr(() => {
        out.warn("suppressed");
        out.info("suppressed");
      });

      expect(stdout).toBe("");
      expect(stderr).toBe("");
    });
  });

  describe("detail", () => {
    test("outputs key-value pairs", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.detail({
          ID: "abc123",
          Name: "example.com",
          Status: "active",
        });
      });

      expect(output).toContain("ID");
      expect(output).toContain("abc123");
      expect(output).toContain("Name");
      expect(output).toContain("example.com");
    });

    test("handles null values", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.detail({ Owner: null });
      });

      expect(output).toContain("Owner");
      expect(output).toContain("(none)");
    });

    test("handles boolean values", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.detail({ Active: true, Paused: false });
      });

      expect(output).toContain("true");
      expect(output).toContain("false");
    });

    test("handles array values", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.detail({ "Name Servers": ["ns1.example.com", "ns2.example.com"] });
      });

      expect(output).toContain("ns1.example.com, ns2.example.com");
    });
  });

  describe("raw", () => {
    test("outputs pretty-printed JSON", () => {
      const out = new OutputFormatterImpl(defaultFlags);
      const output = captureStdout(() => {
        out.raw({ success: true, result: { id: "123" } });
      });

      expect(output).toContain('"success": true');
      expect(output).toContain('"id": "123"');
    });
  });
});
