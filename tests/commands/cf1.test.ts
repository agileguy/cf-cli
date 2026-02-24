import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// CF1 Requests
import { run as reqListRun } from "../../src/commands/cf1/requests/list.js";
import { run as reqGetRun } from "../../src/commands/cf1/requests/get.js";
import { run as reqCreateRun } from "../../src/commands/cf1/requests/create.js";
import { run as reqRouterRun } from "../../src/commands/cf1/requests/index.js";

// CF1 top-level commands
import { run as threatEventsRun } from "../../src/commands/cf1/threat-events.js";
import { run as pirsRun } from "../../src/commands/cf1/pirs.js";
import { run as scansRun } from "../../src/commands/cf1/scans.js";

// Main router
import { run as routerRun } from "../../src/commands/cf1/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const REQUEST_ID = "req-uuid-123";

function sampleCF1Request(overrides: Record<string, unknown> = {}) {
  return {
    id: REQUEST_ID,
    title: "Investigate phishing campaign",
    status: "open",
    priority: "high",
    created_at: "2024-06-01T12:00:00Z",
    updated_at: "2024-06-01T14:00:00Z",
    content: "Phishing emails targeting employees",
    tlp: "amber",
    request_type: "investigation",
    summary: "Phishing campaign analysis",
    ...overrides,
  };
}

function sampleCF1ThreatEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "te-uuid-123",
    title: "DDoS Attack on CDN",
    description: "Large-scale DDoS targeting CDN infrastructure",
    event_type: "ddos",
    created_at: "2024-06-01T12:00:00Z",
    ...overrides,
  };
}

function sampleCF1PIR(overrides: Record<string, unknown> = {}) {
  return {
    id: "pir-uuid-123",
    title: "Track ransomware group",
    description: "Monitor ransomware activities",
    priority: "critical",
    status: "active",
    created_at: "2024-06-01T12:00:00Z",
    ...overrides,
  };
}

function sampleCF1Scan(overrides: Record<string, unknown> = {}) {
  return {
    id: "scan-uuid-123",
    status: "completed",
    target: "192.168.1.0/24",
    scan_type: "port_scan",
    created_at: "2024-06-01T12:00:00Z",
    ...overrides,
  };
}

// ─── Main Router ────────────────────────────────────────────────────────

describe("cf1 main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("shows help with --help", async () => {
    const { ctx, output } = createTestContext();
    await routerRun(["--help"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown cf1 command");
  });

  test("routes 'requests' subcommand", async () => {
    const { ctx, output } = createTestContext({
      post: async () => [sampleCF1Request()],
    });
    await routerRun(["requests", "list", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes 'request' alias", async () => {
    const { ctx, output } = createTestContext({
      post: async () => [sampleCF1Request()],
    });
    await routerRun(["request", "list", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes 'threat-events' subcommand", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [sampleCF1ThreatEvent()],
    });
    await routerRun(["threat-events", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes 'pirs' subcommand", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [sampleCF1PIR()],
    });
    await routerRun(["pirs", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes 'scans' subcommand", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [sampleCF1Scan()],
    });
    await routerRun(["scans", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });
});

// ─── Requests Router ────────────────────────────────────────────────────

describe("cf1 requests router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await reqRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(reqRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown cf1 requests command");
  });

  test("routes 'ls' alias for list", async () => {
    const { ctx, output } = createTestContext({
      post: async () => [],
    });
    await reqRouterRun(["ls", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes 'show' alias for get", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleCF1Request(),
    });
    await reqRouterRun(["show", "--id", REQUEST_ID, "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.jsons).toHaveLength(1);
  });
});

// ─── Requests List ──────────────────────────────────────────────────────

describe("cf1 requests list", () => {
  test("lists requests", async () => {
    const requests = [sampleCF1Request(), sampleCF1Request({ id: "req-2", title: "Botnet tracking" })];
    const { ctx, output } = createTestContext({
      post: async () => requests,
    });

    await reqListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("lists empty requests", async () => {
    const { ctx, output } = createTestContext({
      post: async () => [],
    });

    await reqListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(0);
  });

  test("uses POST method for list", async () => {
    let usedPost = false;
    const { ctx } = createTestContext({
      post: async () => {
        usedPost = true;
        return [];
      },
    });

    await reqListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(usedPost).toBe(true);
  });
});

// ─── Requests Get ───────────────────────────────────────────────────────

describe("cf1 requests get", () => {
  test("gets a request by ID", async () => {
    const req = sampleCF1Request();
    const { ctx, output } = createTestContext({
      get: async () => req,
    });

    await reqGetRun(["--id", REQUEST_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(req);
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(reqGetRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Requests Create ────────────────────────────────────────────────────

describe("cf1 requests create", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(reqCreateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = createTestContext();
    expect(reqCreateRun(["--file", "/tmp/nonexistent-cf-cli-cf1-req.json", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Threat Events ──────────────────────────────────────────────────────

describe("cf1 threat-events", () => {
  test("lists threat events", async () => {
    const events = [sampleCF1ThreatEvent(), sampleCF1ThreatEvent({ id: "te-2" })];
    const { ctx, output } = createTestContext({
      get: async () => events,
    });

    await threatEventsRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("lists empty threat events", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });

    await threatEventsRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(0);
  });
});

// ─── PIRs ───────────────────────────────────────────────────────────────

describe("cf1 pirs", () => {
  test("lists PIRs", async () => {
    const pirs = [sampleCF1PIR()];
    const { ctx, output } = createTestContext({
      get: async () => pirs,
    });

    await pirsRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });

  test("lists empty PIRs", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });

    await pirsRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(0);
  });
});

// ─── Scans ──────────────────────────────────────────────────────────────

describe("cf1 scans", () => {
  test("lists scans", async () => {
    const scans = [sampleCF1Scan(), sampleCF1Scan({ id: "scan-2" })];
    const { ctx, output } = createTestContext({
      get: async () => scans,
    });

    await scansRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("lists empty scans", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });

    await scansRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(0);
  });
});

// ─── API Path Verification ─────────────────────────────────────────────

describe("cf1 API path verification", () => {
  test("requests list posts to /accounts/{id}/cloudforce-one/requests/list", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      post: async (path: string) => {
        calledPath = path;
        return [];
      },
    });

    await reqListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain("/cloudforce-one/requests/list");
    expect(calledPath).toContain(ACCOUNT_ID);
  });

  test("requests get calls /accounts/{id}/cloudforce-one/requests/{id}", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleCF1Request();
      },
    });

    await reqGetRun(["--id", REQUEST_ID, "--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain(`/cloudforce-one/requests/${REQUEST_ID}`);
  });

  test("threat-events calls /accounts/{id}/cloudforce-one/threat-events", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return [];
      },
    });

    await threatEventsRun(["--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain("/cloudforce-one/threat-events");
  });

  test("pirs calls /accounts/{id}/cloudforce-one/pirs", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return [];
      },
    });

    await pirsRun(["--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain("/cloudforce-one/pirs");
  });

  test("scans calls /accounts/{id}/cloudforce-one/scans", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return [];
      },
    });

    await scansRun(["--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain("/cloudforce-one/scans");
  });
});
