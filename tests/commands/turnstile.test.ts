import { describe, test, expect } from "bun:test";
import {
  createTestContext,
  sampleTurnstileWidget,
} from "../helpers.js";

// Widget commands
import { run as listRun } from "../../src/commands/turnstile/widgets/list.js";
import { run as getRun } from "../../src/commands/turnstile/widgets/get.js";
import { run as createRun } from "../../src/commands/turnstile/widgets/create.js";
import { run as updateRun } from "../../src/commands/turnstile/widgets/update.js";
import { run as deleteRun } from "../../src/commands/turnstile/widgets/delete.js";
import { run as rotateSecretRun } from "../../src/commands/turnstile/widgets/rotate-secret.js";

// Routers
import { run as mainRouterRun } from "../../src/commands/turnstile/index.js";
import { run as widgetsRouterRun } from "../../src/commands/turnstile/widgets/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const SITEKEY = "0x4AAAAAAAB1cDE2fGH3IJkl";

function tsCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
  const originalGet = clientOverrides.get as ((path: string, params?: Record<string, string>) => Promise<unknown>) | undefined;
  return createTestContext(
    {
      ...clientOverrides,
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") {
          return [{ id: ACCOUNT_ID, name: "Test Account" }];
        }
        if (originalGet) return originalGet(path, params);
        return {};
      },
    } as Record<string, unknown>,
    flagOverrides,
  );
}

// ─── Widgets List ────────────────────────────────────────────────────────

describe("turnstile widgets list", () => {
  test("lists widgets", async () => {
    const widgets = [
      sampleTurnstileWidget(),
      sampleTurnstileWidget({ sitekey: "0xBBBBBBBB", name: "other-widget" }),
    ];
    const { ctx, output } = tsCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return widgets;
      },
    });

    await listRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = tsCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await listRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
    expect(capturedPath).toContain("challenges/widgets");
  });
});

// ─── Widgets Get ─────────────────────────────────────────────────────────

describe("turnstile widgets get", () => {
  test("gets a widget by sitekey", async () => {
    const widget = sampleTurnstileWidget();
    const { ctx, output } = tsCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return widget;
      },
    });

    await getRun(["--sitekey", SITEKEY, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-widget");
    expect(output.captured.details[0]!["Mode"]).toBe("managed");
  });

  test("does not expose secret in output", async () => {
    const widget = sampleTurnstileWidget();
    const { ctx, output } = tsCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return widget;
      },
    });

    await getRun(["--sitekey", SITEKEY, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Secret"]).toBeUndefined();
  });

  test("throws when --sitekey is missing", async () => {
    const { ctx } = tsCtx();
    expect(getRun([], ctx)).rejects.toThrow("--sitekey");
  });
});

// ─── Widgets Create ──────────────────────────────────────────────────────

describe("turnstile widgets create", () => {
  test("creates a widget", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const widget = sampleTurnstileWidget();
    const { ctx, output } = tsCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return widget;
      },
    });

    await createRun([
      "--name", "my-widget",
      "--domain", "example.com",
      "--mode", "managed",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedPath).toContain("challenges/widgets");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("my-widget");
    expect(body["mode"]).toBe("managed");
    expect(body["domains"]).toEqual(["example.com"]);
  });

  test("supports multiple domains via --domains", async () => {
    let capturedBody: unknown;
    const widget = sampleTurnstileWidget();
    const { ctx } = tsCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return widget;
      },
    });

    await createRun([
      "--name", "my-widget",
      "--domains", "example.com,example.org",
      "--mode", "managed",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["domains"]).toEqual(["example.com", "example.org"]);
  });

  test("throws when --name is missing", async () => {
    const { ctx } = tsCtx();
    expect(createRun(["--domain", "x", "--mode", "managed"], ctx)).rejects.toThrow("--name");
  });

  test("throws when --domain is missing", async () => {
    const { ctx } = tsCtx();
    expect(createRun(["--name", "x", "--mode", "managed"], ctx)).rejects.toThrow("--domain");
  });

  test("throws when --mode is missing", async () => {
    const { ctx } = tsCtx();
    expect(createRun(["--name", "x", "--domain", "y"], ctx)).rejects.toThrow("--mode");
  });
});

// ─── Widgets Update ──────────────────────────────────────────────────────

describe("turnstile widgets update", () => {
  test("updates a widget", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const widget = sampleTurnstileWidget();
    const { ctx, output } = tsCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return widget;
      },
    });

    await updateRun([
      "--sitekey", SITEKEY,
      "--name", "updated-widget",
      "--mode", "invisible",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedPath).toContain(SITEKEY);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("updated");
    const body = capturedBody as Record<string, unknown>;
    expect(body["name"]).toBe("updated-widget");
    expect(body["mode"]).toBe("invisible");
  });

  test("throws when --sitekey is missing", async () => {
    const { ctx } = tsCtx();
    expect(updateRun(["--name", "x"], ctx)).rejects.toThrow("--sitekey");
  });
});

// ─── Widgets Delete ──────────────────────────────────────────────────────

describe("turnstile widgets delete", () => {
  test("deletes a widget with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = tsCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await deleteRun([
      "--sitekey", SITEKEY,
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(deletedPath).toContain(SITEKEY);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = tsCtx({}, { yes: undefined });

    await deleteRun([
      "--sitekey", SITEKEY,
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --sitekey is missing", async () => {
    const { ctx } = tsCtx();
    expect(deleteRun([], ctx)).rejects.toThrow("--sitekey");
  });
});

// ─── Widgets Rotate Secret ──────────────────────────────────────────────

describe("turnstile widgets rotate-secret", () => {
  test("rotates the secret", async () => {
    let capturedPath = "";
    let capturedBody: unknown;
    const result = { sitekey: SITEKEY, secret: "new-secret-value" };
    const { ctx, output } = tsCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return result;
      },
    });

    await rotateSecretRun([
      "--sitekey", SITEKEY,
      "--account-id", ACCOUNT_ID,
    ], ctx);

    expect(capturedPath).toContain(SITEKEY);
    expect(capturedPath).toContain("rotate_secret");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("rotated");
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["New Secret"]).toBe("new-secret-value");
  });

  test("passes invalidate_immediately flag", async () => {
    let capturedBody: unknown;
    const result = { sitekey: SITEKEY, secret: "new-secret" };
    const { ctx } = tsCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return result;
      },
    });

    await rotateSecretRun([
      "--sitekey", SITEKEY,
      "--invalidate-immediately",
      "--account-id", ACCOUNT_ID,
    ], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["invalidate_immediately"]).toBe(true);
  });

  test("throws when --sitekey is missing", async () => {
    const { ctx } = tsCtx();
    expect(rotateSecretRun([], ctx)).rejects.toThrow("--sitekey");
  });
});

// ─── Routers ─────────────────────────────────────────────────────────────

describe("turnstile main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown turnstile command");
  });

  test("routes 'widgets' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["widgets"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'widget' alias", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["widget"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("turnstile widgets router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await widgetsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(widgetsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown turnstile widgets command");
  });
});
