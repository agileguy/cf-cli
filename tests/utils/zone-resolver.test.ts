import { describe, test, expect } from "bun:test";
import { resolveZoneId } from "../../src/utils/zone-resolver.js";
import { mockClient } from "../helpers.js";

describe("resolveZoneId", () => {
  test("returns hex ID directly", async () => {
    const client = mockClient();
    const result = await resolveZoneId("023e105f4ecef8ad9ca31a8372d0c353", client);
    expect(result).toBe("023e105f4ecef8ad9ca31a8372d0c353");
  });

  test("lowercases hex IDs", async () => {
    const client = mockClient();
    const result = await resolveZoneId("023E105F4ECEF8AD9CA31A8372D0C353", client);
    expect(result).toBe("023e105f4ecef8ad9ca31a8372d0c353");
  });

  test("looks up zone name via API", async () => {
    const client = mockClient({
      get: async () => [{ id: "abc12345abc12345abc12345abc12345", name: "example.com" }],
    });
    const result = await resolveZoneId("example.com", client);
    expect(result).toBe("abc12345abc12345abc12345abc12345");
  });

  test("throws on empty zone name", async () => {
    const client = mockClient();
    expect(resolveZoneId("", client)).rejects.toThrow("cannot be empty");
  });

  test("throws on whitespace-only zone name", async () => {
    const client = mockClient();
    expect(resolveZoneId("   ", client)).rejects.toThrow("cannot be empty");
  });

  test("throws when zone name not found", async () => {
    const client = mockClient({
      get: async () => [],
    });
    expect(resolveZoneId("nonexistent.com", client)).rejects.toThrow("Zone not found");
  });

  test("trims whitespace from input", async () => {
    const client = mockClient();
    const result = await resolveZoneId("  023e105f4ecef8ad9ca31a8372d0c353  ", client);
    expect(result).toBe("023e105f4ecef8ad9ca31a8372d0c353");
  });
});
