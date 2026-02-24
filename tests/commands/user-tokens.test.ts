import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as listRun } from "../../src/commands/user/tokens/list.js";
import { run as getRun } from "../../src/commands/user/tokens/get.js";
import { run as updateRun } from "../../src/commands/user/tokens/update.js";
import { run as deleteRun } from "../../src/commands/user/tokens/delete.js";
import { run as verifyRun } from "../../src/commands/user/tokens/verify.js";
import { run as rollRun } from "../../src/commands/user/tokens/roll.js";
import { run as routerRun } from "../../src/commands/user/tokens/index.js";

function sampleToken(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "token-uuid-123",
    name: "My API Token",
    status: "active",
    issued_on: "2024-01-01T00:00:00.000Z",
    modified_on: "2024-06-01T00:00:00.000Z",
    expires_on: "2025-01-01T00:00:00.000Z",
    policies: [
      {
        id: "policy-1",
        effect: "allow",
        resources: { "com.cloudflare.api.account.*": "*" },
        permission_groups: [{ id: "pg-1", name: "Account Settings Read" }],
      },
    ],
    ...overrides,
  };
}

describe("user tokens list", () => {
  test("lists tokens", async () => {
    const tokens = [sampleToken(), sampleToken({ id: "token-2", name: "Second Token" })];
    const { ctx, output } = createTestContext({
      get: async () => tokens,
    });

    await listRun([], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("user tokens get", () => {
  test("gets token details", async () => {
    const token = sampleToken();
    const { ctx, output } = createTestContext({
      get: async () => token,
    });

    await getRun(["--id", "token-uuid-123"], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("My API Token");
    expect(output.captured.details[0]!["Status"]).toBe("active");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(getRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("user tokens update", () => {
  test("updates token name", async () => {
    let capturedBody: unknown;
    const { ctx, output } = createTestContext({
      put: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleToken({ name: "Updated Token" });
      },
    });

    await updateRun(["--id", "token-uuid-123", "--name", "Updated Token"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect((capturedBody as Record<string, unknown>).name).toBe("Updated Token");
  });

  test("updates token status", async () => {
    let capturedBody: unknown;
    const { ctx } = createTestContext({
      put: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleToken({ status: "disabled" });
      },
    });

    await updateRun(["--id", "token-uuid-123", "--status", "disabled"], ctx);

    expect((capturedBody as Record<string, unknown>).status).toBe("disabled");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--name", "foo"], ctx)).rejects.toThrow("--id");
  });

  test("throws when no update fields provided", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--id", "abc"], ctx)).rejects.toThrow("At least one");
  });

  test("throws on invalid status", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--id", "abc", "--status", "invalid"], ctx)).rejects.toThrow('"active" or "disabled"');
  });
});

describe("user tokens delete", () => {
  test("deletes token with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return { id: "token-uuid-123" };
      },
    });

    await deleteRun(["--id", "token-uuid-123"], ctx);

    expect(deletedPath).toContain("token-uuid-123");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await deleteRun(["--id", "token-uuid-123"], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(deleteRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("user tokens verify", () => {
  test("verifies current token", async () => {
    const { ctx, output } = createTestContext({
      get: async () => ({
        id: "token-uuid-123",
        status: "active",
        not_before: "2024-01-01T00:00:00.000Z",
        expires_on: "2025-01-01T00:00:00.000Z",
      }),
    });

    await verifyRun([], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Status"]).toBe("active");
  });
});

describe("user tokens roll", () => {
  test("rolls a token", async () => {
    let capturedPath = "";
    const { ctx, output } = createTestContext({
      put: async (path: string) => {
        capturedPath = path;
        return { id: "token-uuid-123", value: "new-secret-value" };
      },
    });

    await rollRun(["--id", "token-uuid-123"], ctx);

    expect(capturedPath).toContain("token-uuid-123/value");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.infos[0]).toContain("new-secret-value");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(rollRun([], ctx)).rejects.toThrow("--id");
  });
});

describe("user tokens router", () => {
  test("routes to list", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["list"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes with aliases", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["ls"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown tokens command");
  });
});
