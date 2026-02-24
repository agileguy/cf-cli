import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Device commands
import { run as listRun } from "../../src/commands/devices/list.js";
import { run as getRun } from "../../src/commands/devices/get.js";
import { run as revokeRun } from "../../src/commands/devices/revoke.js";

// Registrations
import { run as regsListRun } from "../../src/commands/devices/registrations/list.js";

// Posture rules
import { run as postureListRun } from "../../src/commands/devices/posture/rules/list.js";
import { run as postureCreateRun } from "../../src/commands/devices/posture/rules/create.js";
import { run as postureUpdateRun } from "../../src/commands/devices/posture/rules/update.js";
import { run as postureDeleteRun } from "../../src/commands/devices/posture/rules/delete.js";

// Routers
import { run as mainRouterRun } from "../../src/commands/devices/index.js";
import { run as regsRouterRun } from "../../src/commands/devices/registrations/index.js";
import { run as postureRouterRun } from "../../src/commands/devices/posture/index.js";
import { run as postureRulesRouterRun } from "../../src/commands/devices/posture/rules/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const DEVICE_ID = "device-uuid-123";
const RULE_ID = "rule-uuid-456";

function sampleDevice(overrides: Record<string, unknown> = {}) {
  return {
    id: DEVICE_ID,
    name: "Dan's Laptop",
    device_type: "macos",
    version: "2024.6.0",
    ip: "10.0.0.1",
    mac_address: "AA:BB:CC:DD:EE:FF",
    os_version: "14.5",
    serial_number: "SN12345",
    user: { id: "user-1", email: "dan@example.com" },
    last_seen: "2024-06-01T12:00:00.000Z",
    created: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function sampleRegistration(overrides: Record<string, unknown> = {}) {
  return {
    id: "reg-uuid-123",
    device_id: DEVICE_ID,
    user: { id: "user-1", email: "dan@example.com" },
    status: "active",
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function samplePostureRule(overrides: Record<string, unknown> = {}) {
  return {
    id: RULE_ID,
    name: "Disk Encryption",
    type: "file",
    description: "Require disk encryption",
    ...overrides,
  };
}

function devCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
  const originalGet = clientOverrides.get as ((path: string, params?: Record<string, string>) => Promise<unknown>) | undefined;
  return createTestContext(
    {
      ...clientOverrides,
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID, name: "Test Account" }];
        if (originalGet) return originalGet(path, params);
        return {};
      },
    } as Record<string, unknown>,
    flagOverrides,
  );
}

// ─── Devices List ───────────────────────────────────────────────────────

describe("devices list", () => {
  test("lists devices", async () => {
    const devices = [sampleDevice(), sampleDevice({ id: "device-2", name: "Phone" })];
    const { ctx, output } = devCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return devices;
      },
    });

    await listRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = devCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await listRun([], ctx);

    expect(capturedPath).toContain(ACCOUNT_ID);
    expect(capturedPath).toContain("devices");
  });
});

// ─── Devices Get ────────────────────────────────────────────────────────

describe("devices get", () => {
  test("gets a device by ID", async () => {
    const device = sampleDevice();
    const { ctx, output } = devCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return device;
      },
    });

    await getRun(["--id", DEVICE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("Dan's Laptop");
    expect(output.captured.details[0]!["Type"]).toBe("macos");
    expect(output.captured.details[0]!["User"]).toBe("dan@example.com");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = devCtx();
    expect(getRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Devices Revoke ─────────────────────────────────────────────────────

describe("devices revoke", () => {
  test("revokes a device with --yes", async () => {
    let capturedPath = "";
    const { ctx, output } = devCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      post: async (path: string) => {
        capturedPath = path;
        return {};
      },
    });

    await revokeRun(["--id", DEVICE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(capturedPath).toContain(DEVICE_ID);
    expect(capturedPath).toContain("revoke");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("revoked");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = devCtx({}, { yes: undefined });

    await revokeRun(["--id", DEVICE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = devCtx();
    expect(revokeRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Device Registrations List ──────────────────────────────────────────

describe("devices registrations list", () => {
  test("lists registrations", async () => {
    const regs = [sampleRegistration(), sampleRegistration({ id: "reg-2" })];
    const { ctx, output } = devCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return regs;
      },
    });

    await regsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("auto-resolves account ID", async () => {
    let capturedPath = "";
    const { ctx } = devCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedPath = path;
        return [];
      },
    });

    await regsListRun([], ctx);

    expect(capturedPath).toContain("registrations");
  });
});

// ─── Device Posture Rules List ──────────────────────────────────────────

describe("devices posture rules list", () => {
  test("lists posture rules", async () => {
    const rules = [samplePostureRule(), samplePostureRule({ id: "rule-2", name: "Firewall" })];
    const { ctx, output } = devCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return rules;
      },
    });

    await postureListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

// ─── Device Posture Rules Create ────────────────────────────────────────

describe("devices posture rules create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = devCtx();
    expect(postureCreateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = devCtx();
    expect(postureCreateRun([
      "--file", "/tmp/nonexistent-cf-cli-posture.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Device Posture Rules Update ────────────────────────────────────────

describe("devices posture rules update", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = devCtx();
    expect(postureUpdateRun(["--file", "test.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = devCtx();
    expect(postureUpdateRun(["--id", RULE_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = devCtx();
    expect(postureUpdateRun([
      "--id", RULE_ID,
      "--file", "/tmp/nonexistent-cf-cli-posture.json",
      "--account-id", ACCOUNT_ID,
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Device Posture Rules Delete ────────────────────────────────────────

describe("devices posture rules delete", () => {
  test("deletes a posture rule with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = devCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await postureDeleteRun(["--id", RULE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(deletedPath).toContain(RULE_ID);
    expect(deletedPath).toContain("posture");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = devCtx({}, { yes: undefined });

    await postureDeleteRun(["--id", RULE_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = devCtx();
    expect(postureDeleteRun([], ctx)).rejects.toThrow("--id");
  });
});

// ─── Routers ────────────────────────────────────────────────────────────

describe("devices main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown devices command");
  });

  test("routes 'registrations' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["registrations"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'posture' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["posture"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("devices registrations router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await regsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(regsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown devices registrations command");
  });
});

describe("devices posture router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await postureRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(postureRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown devices posture command");
  });
});

describe("devices posture rules router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await postureRulesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(postureRulesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown devices posture rules command");
  });
});
