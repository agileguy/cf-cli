import { describe, test, expect } from "bun:test";
import { createTestContext, sampleUser } from "../helpers.js";

import { run as getRun } from "../../src/commands/user/get.js";
import { run as tokenVerifyRun } from "../../src/commands/user/token-verify.js";
import { run as routerRun } from "../../src/commands/user/index.js";

describe("user get", () => {
  test("displays user details", async () => {
    const user = sampleUser();
    const { ctx, output } = createTestContext({
      get: async () => user,
    });

    await getRun([], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Email"]).toBe("test@example.com");
    expect(output.captured.details[0]!["Username"]).toBe("testuser");
  });
});

describe("user token verify", () => {
  test("displays active token", async () => {
    const { ctx, output } = createTestContext({
      get: async () => ({
        id: "token123",
        status: "active",
        not_before: "2024-01-01T00:00:00.000Z",
        expires_on: "2025-01-01T00:00:00.000Z",
      }),
    });

    await tokenVerifyRun([], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Status"]).toBe("active");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("valid");
  });

  test("warns about non-active token", async () => {
    const { ctx, output } = createTestContext({
      get: async () => ({
        id: "token123",
        status: "expired",
      }),
    });

    await tokenVerifyRun([], ctx);

    expect(output.captured.warnings).toHaveLength(1);
    expect(output.captured.warnings[0]).toContain("expired");
  });
});

describe("user router", () => {
  test("routes get", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleUser(),
    });
    await routerRun(["get"], ctx);
    expect(output.captured.details).toHaveLength(1);
  });

  test("routes whoami alias", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleUser(),
    });
    await routerRun(["whoami"], ctx);
    expect(output.captured.details).toHaveLength(1);
  });

  test("routes token verify", async () => {
    const { ctx, output } = createTestContext({
      get: async () => ({ id: "t1", status: "active" }),
    });
    await routerRun(["token", "verify"], ctx);
    expect(output.captured.details).toHaveLength(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown user command");
  });

  test("shows help", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});
