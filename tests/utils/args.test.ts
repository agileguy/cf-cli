import { describe, test, expect } from "bun:test";
import { parseArgs, getStringFlag, getBoolFlag, getNumberFlag, getListFlag } from "../../src/utils/args.js";

describe("parseArgs", () => {
  test("parses positional arguments", () => {
    const result = parseArgs(["zones", "list"]);
    expect(result.positional).toEqual(["zones", "list"]);
    expect(result.flags).toEqual({});
  });

  test("parses --flag value pairs", () => {
    const result = parseArgs(["--zone", "example.com", "--type", "A"]);
    expect(result.flags["zone"]).toBe("example.com");
    expect(result.flags["type"]).toBe("A");
  });

  test("parses --flag=value pairs", () => {
    const result = parseArgs(["--zone=example.com", "--type=A"]);
    expect(result.flags["zone"]).toBe("example.com");
    expect(result.flags["type"]).toBe("A");
  });

  test("parses boolean flags", () => {
    const result = parseArgs(["--all", "--verbose"]);
    expect(result.flags["all"]).toBe(true);
    expect(result.flags["verbose"]).toBe(true);
  });

  test("parses --no-* flags as false", () => {
    const result = parseArgs(["--no-color"]);
    expect(result.flags["color"]).toBe(false);
  });

  test("handles kebab-case to camelCase conversion", () => {
    const result = parseArgs(["--per-page", "50", "--account-id", "abc123"]);
    expect(result.flags["perPage"]).toBe("50");
    expect(result.flags["accountId"]).toBe("abc123");
  });

  test("handles -- separator", () => {
    const result = parseArgs(["--flag", "val", "--", "positional1", "--not-a-flag"]);
    expect(result.flags["flag"]).toBe("val");
    expect(result.positional).toEqual(["positional1", "--not-a-flag"]);
  });

  test("handles short flags", () => {
    const result = parseArgs(["-f", "value"]);
    expect(result.flags["f"]).toBe("value");
  });

  test("handles short boolean flags", () => {
    const result = parseArgs(["-v"]);
    expect(result.flags["v"]).toBe(true);
  });

  test("handles mixed positional and flags", () => {
    const result = parseArgs(["zones", "list", "--all", "--name", "example.com"]);
    expect(result.positional).toEqual(["zones", "list"]);
    expect(result.flags["all"]).toBe(true);
    expect(result.flags["name"]).toBe("example.com");
  });

  test("handles empty args", () => {
    const result = parseArgs([]);
    expect(result.positional).toEqual([]);
    expect(result.flags).toEqual({});
  });
});

describe("getStringFlag", () => {
  test("returns string value", () => {
    expect(getStringFlag({ zone: "example.com" }, "zone")).toBe("example.com");
  });

  test("returns undefined for boolean values", () => {
    expect(getStringFlag({ all: true }, "all")).toBeUndefined();
  });

  test("returns undefined for missing keys", () => {
    expect(getStringFlag({}, "missing")).toBeUndefined();
  });
});

describe("getBoolFlag", () => {
  test("returns true for boolean true", () => {
    expect(getBoolFlag({ all: true }, "all")).toBe(true);
  });

  test("returns false for boolean false", () => {
    expect(getBoolFlag({ color: false }, "color")).toBe(false);
  });

  test("returns false for missing keys", () => {
    expect(getBoolFlag({}, "missing")).toBe(false);
  });

  test("returns true for non-empty strings", () => {
    expect(getBoolFlag({ flag: "yes" }, "flag")).toBe(true);
  });

  test("returns false for string 'false'", () => {
    expect(getBoolFlag({ flag: "false" }, "flag")).toBe(false);
  });
});

describe("getNumberFlag", () => {
  test("parses numeric strings", () => {
    expect(getNumberFlag({ page: "5" }, "page")).toBe(5);
  });

  test("returns undefined for non-numeric strings", () => {
    expect(getNumberFlag({ page: "abc" }, "page")).toBeUndefined();
  });

  test("returns undefined for missing keys", () => {
    expect(getNumberFlag({}, "page")).toBeUndefined();
  });

  test("returns undefined for boolean values", () => {
    expect(getNumberFlag({ flag: true }, "flag")).toBeUndefined();
  });
});

describe("getListFlag", () => {
  test("splits comma-separated values", () => {
    expect(getListFlag({ urls: "a.com,b.com,c.com" }, "urls")).toEqual(["a.com", "b.com", "c.com"]);
  });

  test("trims whitespace", () => {
    expect(getListFlag({ urls: "a.com , b.com" }, "urls")).toEqual(["a.com", "b.com"]);
  });

  test("returns undefined for missing keys", () => {
    expect(getListFlag({}, "urls")).toBeUndefined();
  });

  test("returns undefined for boolean values", () => {
    expect(getListFlag({ flag: true }, "flag")).toBeUndefined();
  });

  test("filters empty entries", () => {
    expect(getListFlag({ urls: "a,,b," }, "urls")).toEqual(["a", "b"]);
  });
});
