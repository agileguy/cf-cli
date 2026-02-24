import { describe, test, expect } from "bun:test";
import {
  parseArgs,
  getStringFlag,
  getBoolFlag,
  getNumberFlag,
  getListFlag,
} from "../src/utils/args.js";

describe("parseArgs", () => {
  test("parses --flag=value", () => {
    const result = parseArgs(["--name=test"]);
    expect(result.flags["name"]).toBe("test");
  });

  test("parses --flag value", () => {
    const result = parseArgs(["--name", "test"]);
    expect(result.flags["name"]).toBe("test");
  });

  test("parses --boolean-flag as true", () => {
    const result = parseArgs(["--verbose"]);
    expect(result.flags["verbose"]).toBe(true);
  });

  test("parses --no-flag as false", () => {
    const result = parseArgs(["--no-color"]);
    expect(result.flags["color"]).toBe(false);
  });

  test("parses positional arguments", () => {
    const result = parseArgs(["zones", "list", "--verbose"]);
    expect(result.positional).toEqual(["zones", "list"]);
    expect(result.flags["verbose"]).toBe(true);
  });

  test("-- stops flag parsing", () => {
    const result = parseArgs(["--flag", "--", "--not-a-flag"]);
    expect(result.flags["flag"]).toBe(true);
    expect(result.positional).toContain("--not-a-flag");
  });

  test("normalizes kebab-case to camelCase", () => {
    const result = parseArgs(["--per-page=50"]);
    expect(result.flags["perPage"]).toBe("50");
  });

  test("handles short flags -f value", () => {
    const result = parseArgs(["-o", "json"]);
    expect(result.flags["o"]).toBe("json");
  });

  test("handles short boolean flags -v", () => {
    const result = parseArgs(["-v"]);
    expect(result.flags["v"]).toBe(true);
  });

  test("handles mixed flags and positional args", () => {
    const result = parseArgs([
      "dns",
      "list",
      "--zone",
      "example.com",
      "--type",
      "A",
      "--verbose",
    ]);
    expect(result.positional).toEqual(["dns", "list"]);
    expect(result.flags["zone"]).toBe("example.com");
    expect(result.flags["type"]).toBe("A");
    expect(result.flags["verbose"]).toBe(true);
  });
});

describe("flag helpers", () => {
  test("getStringFlag returns string or undefined", () => {
    const flags: Record<string, string | boolean> = { name: "test", verbose: true };
    expect(getStringFlag(flags, "name")).toBe("test");
    expect(getStringFlag(flags, "verbose")).toBeUndefined(); // boolean, not string
    expect(getStringFlag(flags, "missing")).toBeUndefined();
  });

  test("getBoolFlag returns boolean", () => {
    const flags: Record<string, string | boolean> = { verbose: true, quiet: false, output: "json" };
    expect(getBoolFlag(flags, "verbose")).toBe(true);
    expect(getBoolFlag(flags, "quiet")).toBe(false);
    expect(getBoolFlag(flags, "output")).toBe(true); // truthy string
    expect(getBoolFlag(flags, "missing")).toBe(false);
  });

  test("getNumberFlag returns number or undefined", () => {
    const flags: Record<string, string | boolean> = { page: "3", verbose: true, bad: "abc" };
    expect(getNumberFlag(flags, "page")).toBe(3);
    expect(getNumberFlag(flags, "verbose")).toBeUndefined(); // boolean
    expect(getNumberFlag(flags, "bad")).toBeUndefined(); // NaN
    expect(getNumberFlag(flags, "missing")).toBeUndefined();
  });

  test("getListFlag returns string array or undefined", () => {
    const flags: Record<string, string | boolean> = { tags: "a,b,c", verbose: true };
    expect(getListFlag(flags, "tags")).toEqual(["a", "b", "c"]);
    expect(getListFlag(flags, "verbose")).toBeUndefined(); // boolean
    expect(getListFlag(flags, "missing")).toBeUndefined();
  });

  test("getListFlag trims whitespace", () => {
    const flags: Record<string, string | boolean> = { tags: " a , b , c " };
    expect(getListFlag(flags, "tags")).toEqual(["a", "b", "c"]);
  });
});
