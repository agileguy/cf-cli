import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// URL Scanner commands
import { run as scanRun } from "../../src/commands/url-scanner/scan.js";
import { run as bulkRun } from "../../src/commands/url-scanner/bulk.js";
import { run as getRun } from "../../src/commands/url-scanner/get.js";
import { run as searchRun } from "../../src/commands/url-scanner/search.js";
import { run as harRun } from "../../src/commands/url-scanner/har.js";
import { run as screenshotRun } from "../../src/commands/url-scanner/screenshot.js";
import { run as domRun } from "../../src/commands/url-scanner/dom.js";

// Router
import { run as routerRun } from "../../src/commands/url-scanner/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";
const SCAN_UUID = "550e8400-e29b-41d4-a716-446655440000";

function sampleScanResult(overrides: Record<string, unknown> = {}) {
  return {
    uuid: SCAN_UUID,
    url: "https://example.com",
    visibility: "Public",
    status: "finished",
    created_at: "2024-06-01T12:00:00Z",
    finished_at: "2024-06-01T12:01:00Z",
    verdicts: { overall: { malicious: false } },
    ...overrides,
  };
}

function sampleHAR(overrides: Record<string, unknown> = {}) {
  return {
    log: {
      version: "1.2",
      entries: [
        { request: { url: "https://example.com" }, response: { status: 200 } },
      ],
    },
    ...overrides,
  };
}

function sampleDOM(overrides: Record<string, unknown> = {}) {
  return {
    content: "<html><body>Hello</body></html>",
    ...overrides,
  };
}

// ─── Main Router ────────────────────────────────────────────────────────

describe("url-scanner main router", () => {
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
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown url-scanner command");
  });

  test("routes 'get' subcommand", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleScanResult(),
    });
    await routerRun(["get", "--id", SCAN_UUID, "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.jsons).toHaveLength(1);
  });

  test("routes 'show' alias", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleScanResult(),
    });
    await routerRun(["show", "--id", SCAN_UUID, "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.jsons).toHaveLength(1);
  });
});

// ─── Scan ───────────────────────────────────────────────────────────────

describe("url-scanner scan", () => {
  test("submits a URL for scanning", async () => {
    let postedBody: Record<string, unknown> | undefined;
    const { ctx, output } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        postedBody = body as Record<string, unknown>;
        return sampleScanResult();
      },
    });

    await scanRun(["--url", "https://example.com", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(postedBody?.url).toBe("https://example.com");
    expect(postedBody?.visibility).toBe("Private");
  });

  test("submits with --public flag", async () => {
    let postedBody: Record<string, unknown> | undefined;
    const { ctx } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        postedBody = body as Record<string, unknown>;
        return sampleScanResult();
      },
    });

    await scanRun(["--url", "https://example.com", "--public", "--account-id", ACCOUNT_ID], ctx);

    expect(postedBody?.visibility).toBe("Public");
  });

  test("throws when --url is missing", async () => {
    const { ctx } = createTestContext();
    expect(scanRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--url");
  });
});

// ─── Bulk ───────────────────────────────────────────────────────────────

describe("url-scanner bulk", () => {
  test("throws when --file is missing", async () => {
    const { ctx } = createTestContext();
    expect(bulkRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = createTestContext();
    expect(bulkRun(["--file", "/tmp/nonexistent-cf-cli-urls.txt", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Get ────────────────────────────────────────────────────────────────

describe("url-scanner get", () => {
  test("fetches scan result by ID", async () => {
    const data = sampleScanResult();
    const { ctx, output } = createTestContext({
      get: async () => data,
    });

    await getRun(["--id", SCAN_UUID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(data);
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(getRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Search ─────────────────────────────────────────────────────────────

describe("url-scanner search", () => {
  test("searches scan results", async () => {
    const data = { tasks: [sampleScanResult()] };
    const { ctx, output } = createTestContext({
      get: async () => data,
    });

    await searchRun(["--query", "example.com", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("passes date params", async () => {
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        gotParams = params;
        return { tasks: [] };
      },
    });

    await searchRun(["--query", "test", "--date-start", "2024-01-01", "--date-end", "2024-06-01", "--account-id", ACCOUNT_ID], ctx);

    expect(gotParams?.q).toBe("test");
    expect(gotParams?.date_start).toBe("2024-01-01");
    expect(gotParams?.date_end).toBe("2024-06-01");
  });

  test("throws when --query is missing", async () => {
    const { ctx } = createTestContext();
    expect(searchRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--query");
  });
});

// ─── HAR ────────────────────────────────────────────────────────────────

describe("url-scanner har", () => {
  test("fetches HAR archive", async () => {
    const data = sampleHAR();
    const { ctx, output } = createTestContext({
      get: async () => data,
    });

    await harRun(["--id", SCAN_UUID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(data);
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(harRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Screenshot ─────────────────────────────────────────────────────────

describe("url-scanner screenshot", () => {
  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(screenshotRun(["--output-file", "/tmp/test.png", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });

  test("throws when --output-file is missing", async () => {
    const { ctx } = createTestContext();
    expect(screenshotRun(["--id", SCAN_UUID, "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--output-file");
  });
});

// ─── DOM ────────────────────────────────────────────────────────────────

describe("url-scanner dom", () => {
  test("fetches DOM snapshot", async () => {
    const data = sampleDOM();
    const { ctx, output } = createTestContext({
      get: async () => data,
    });

    await domRun(["--id", SCAN_UUID, "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
    expect(output.captured.jsons[0]).toEqual(data);
  });

  test("throws when --id is missing", async () => {
    const { ctx } = createTestContext();
    expect(domRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── API Path Verification ─────────────────────────────────────────────

describe("url-scanner API path verification", () => {
  test("scan posts to /accounts/{id}/urlscanner/scan", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      post: async (path: string) => {
        calledPath = path;
        return sampleScanResult();
      },
    });

    await scanRun(["--url", "https://example.com", "--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain("/urlscanner/scan");
    expect(calledPath).toContain(ACCOUNT_ID);
  });

  test("get calls /accounts/{id}/urlscanner/scan/{uuid}", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleScanResult();
      },
    });

    await getRun(["--id", SCAN_UUID, "--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain(`/urlscanner/scan/${SCAN_UUID}`);
  });

  test("search calls /accounts/{id}/urlscanner/scan with query params", async () => {
    let calledPath = "";
    let gotParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (path: string, params?: Record<string, string>) => {
        calledPath = path;
        gotParams = params;
        return { tasks: [] };
      },
    });

    await searchRun(["--query", "test", "--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain("/urlscanner/scan");
    expect(gotParams?.q).toBe("test");
  });

  test("har calls /accounts/{id}/urlscanner/scan/{uuid}/har", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleHAR();
      },
    });

    await harRun(["--id", SCAN_UUID, "--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain(`/urlscanner/scan/${SCAN_UUID}/har`);
  });

  test("dom calls /accounts/{id}/urlscanner/scan/{uuid}/dom", async () => {
    let calledPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        calledPath = path;
        return sampleDOM();
      },
    });

    await domRun(["--id", SCAN_UUID, "--account-id", ACCOUNT_ID], ctx);

    expect(calledPath).toContain(`/urlscanner/scan/${SCAN_UUID}/dom`);
  });
});
