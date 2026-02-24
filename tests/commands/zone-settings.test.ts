import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as listRun } from "../../src/commands/zones/settings/list.js";
import { run as getRun } from "../../src/commands/zones/settings/get.js";
import { run as updateRun } from "../../src/commands/zones/settings/update.js";
import { run as routerRun } from "../../src/commands/zones/settings/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";

function sampleZoneSetting(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "always_use_https",
    value: "on",
    editable: true,
    modified_on: "2024-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("zones settings list", () => {
  test("lists zone settings", async () => {
    const settings = [
      sampleZoneSetting(),
      sampleZoneSetting({ id: "min_tls_version", value: "1.2" }),
      sampleZoneSetting({ id: "security_level", value: "medium" }),
    ];
    const { ctx, output } = createTestContext({
      get: async () => settings,
    });

    await listRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(3);
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(listRun([], ctx)).rejects.toThrow("--zone");
  });

  test("resolves zone name to ID", async () => {
    let capturedPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        capturedPath = path;
        if (path === "/zones") return [{ id: ZONE_ID }];
        return [];
      },
    });

    await listRun(["--zone", "example.com"], ctx);

    expect(capturedPath).toContain(ZONE_ID);
  });
});

describe("zones settings get", () => {
  test("gets a specific setting", async () => {
    const setting = sampleZoneSetting();
    const { ctx, output } = createTestContext({
      get: async () => setting,
    });

    await getRun(["--zone", ZONE_ID, "--setting", "always_use_https"], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Setting"]).toBe("always_use_https");
    expect(output.captured.details[0]!["Value"]).toBe("on");
  });

  test("displays object values as JSON", async () => {
    const setting = sampleZoneSetting({
      id: "mobile_redirect",
      value: { status: "on", mobile_subdomain: "m", strip_uri: false },
    });
    const { ctx, output } = createTestContext({
      get: async () => setting,
    });

    await getRun(["--zone", ZONE_ID, "--setting", "mobile_redirect"], ctx);

    expect(output.captured.details).toHaveLength(1);
    const val = output.captured.details[0]!["Value"] as string;
    expect(val).toContain("mobile_subdomain");
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(getRun(["--setting", "abc"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --setting missing", async () => {
    const { ctx } = createTestContext();
    expect(getRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--setting");
  });
});

describe("zones settings update", () => {
  test("updates a setting with string value", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = createTestContext({
      patch: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return sampleZoneSetting({ value: "off" });
      },
    });

    await updateRun(["--zone", ZONE_ID, "--setting", "always_use_https", "--value", "off"], ctx);

    expect(capturedPath).toContain("always_use_https");
    expect((capturedBody as Record<string, unknown>).value).toBe("off");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("updates a setting with JSON value", async () => {
    let capturedBody: unknown;
    const { ctx } = createTestContext({
      patch: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleZoneSetting({ id: "mobile_redirect", value: { status: "on" } });
      },
    });

    await updateRun([
      "--zone", ZONE_ID,
      "--setting", "mobile_redirect",
      "--value", '{"status":"on","mobile_subdomain":"m","strip_uri":false}',
    ], ctx);

    const body = capturedBody as Record<string, unknown>;
    const value = body.value as Record<string, unknown>;
    expect(value.status).toBe("on");
    expect(value.mobile_subdomain).toBe("m");
  });

  test("falls back to string when not valid JSON", async () => {
    let capturedBody: unknown;
    const { ctx } = createTestContext({
      patch: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleZoneSetting({ value: "medium" });
      },
    });

    await updateRun(["--zone", ZONE_ID, "--setting", "security_level", "--value", "medium"], ctx);

    expect((capturedBody as Record<string, unknown>).value).toBe("medium");
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--setting", "abc", "--value", "x"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --setting missing", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--zone", ZONE_ID, "--value", "x"], ctx)).rejects.toThrow("--setting");
  });

  test("throws when --value missing", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--zone", ZONE_ID, "--setting", "abc"], ctx)).rejects.toThrow("--value");
  });
});

describe("zones settings router", () => {
  test("routes to list", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["list", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes with aliases", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["ls", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes to get", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleZoneSetting(),
    });
    await routerRun(["get", "--zone", ZONE_ID, "--setting", "always_use_https"], ctx);
    expect(output.captured.details).toHaveLength(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown settings command");
  });
});
