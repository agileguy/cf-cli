import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Pages commands
import { run as pagesListRun } from "../../src/commands/observatory/pages/list.js";

// Tests commands
import { run as testsListRun } from "../../src/commands/observatory/tests/list.js";
import { run as testsCreateRun } from "../../src/commands/observatory/tests/create.js";
import { run as testsGetRun } from "../../src/commands/observatory/tests/get.js";
import { run as testsDeleteRun } from "../../src/commands/observatory/tests/delete.js";

// Schedule commands
import { run as schedListRun } from "../../src/commands/observatory/schedule/list.js";
import { run as schedCreateRun } from "../../src/commands/observatory/schedule/create.js";
import { run as schedDeleteRun } from "../../src/commands/observatory/schedule/delete.js";

// Routers
import { run as mainRouterRun } from "../../src/commands/observatory/index.js";
import { run as pagesRouterRun } from "../../src/commands/observatory/pages/index.js";
import { run as testsRouterRun } from "../../src/commands/observatory/tests/index.js";
import { run as schedRouterRun } from "../../src/commands/observatory/schedule/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";
const TEST_ID = "test-uuid-123";
const TEST_URL = "https://example.com/page";

function samplePage(overrides: Record<string, unknown> = {}) {
  return {
    url: TEST_URL,
    region: "us-central1",
    ...overrides,
  };
}

function sampleTest(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_ID,
    url: TEST_URL,
    region: "us-central1",
    date: "2024-06-01T12:00:00Z",
    mobile_report: {
      state: "COMPLETED",
      performance_score: 0.85,
      fcp: 1200,
      lcp: 2100,
      cls: 0.05,
      tbt: 200,
    },
    desktop_report: {
      state: "COMPLETED",
      performance_score: 0.92,
      fcp: 800,
      lcp: 1500,
      cls: 0.02,
      tbt: 100,
    },
    ...overrides,
  };
}

function sampleSchedule(overrides: Record<string, unknown> = {}) {
  return {
    url: TEST_URL,
    region: "us-central1",
    frequency: "DAILY",
    ...overrides,
  };
}

function obsCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
  const originalGet = clientOverrides.get as ((path: string, params?: Record<string, string>) => Promise<unknown>) | undefined;
  return createTestContext(
    {
      ...clientOverrides,
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/zones") return [{ id: ZONE_ID, name: "example.com" }];
        if (originalGet) return originalGet(path, params);
        return {};
      },
    } as Record<string, unknown>,
    flagOverrides,
  );
}

// ─── Pages List ─────────────────────────────────────────────────────────

describe("observatory pages list", () => {
  test("lists tested pages", async () => {
    const pages = [samplePage(), samplePage({ url: "https://example.com/other" })];
    const { ctx, output } = obsCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return pages;
      },
    });

    await pagesListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = obsCtx();
    expect(pagesListRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Tests List ─────────────────────────────────────────────────────────

describe("observatory tests list", () => {
  test("lists tests for a URL", async () => {
    const tests = [sampleTest(), sampleTest({ id: "test-2" })];
    const { ctx, output } = obsCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return tests;
      },
    });

    await testsListRun(["--zone", ZONE_ID, "--url", TEST_URL], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = obsCtx();
    expect(testsListRun(["--url", TEST_URL], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --url is missing", async () => {
    const { ctx } = obsCtx();
    expect(testsListRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--url");
  });
});

// ─── Tests Create ───────────────────────────────────────────────────────

describe("observatory tests create", () => {
  test("creates a speed test", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const testResult = sampleTest();
    const { ctx, output } = obsCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return {};
      },
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return testResult;
      },
    });

    await testsCreateRun(["--zone", ZONE_ID, "--url", TEST_URL], ctx);

    expect(capturedPath).toContain("speed_api");
    expect(capturedPath).toContain("tests");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["url"]).toBe(TEST_URL);
  });

  test("passes region when provided", async () => {
    let capturedBody: unknown;
    const { ctx } = obsCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleTest();
      },
    });

    await testsCreateRun(["--zone", ZONE_ID, "--url", TEST_URL, "--region", "us-east1"], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["region"]).toBe("us-east1");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = obsCtx();
    expect(testsCreateRun(["--url", TEST_URL], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --url is missing", async () => {
    const { ctx } = obsCtx();
    expect(testsCreateRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--url");
  });
});

// ─── Tests Get ──────────────────────────────────────────────────────────

describe("observatory tests get", () => {
  test("gets test details with reports", async () => {
    const testResult = sampleTest();
    const { ctx, output } = obsCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return testResult;
      },
    });

    await testsGetRun(["--zone", ZONE_ID, "--id", TEST_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe(TEST_ID);
    expect(output.captured.details[0]!["URL"]).toBe(TEST_URL);
    expect(output.captured.details[0]!["Mobile Performance"]).toBe(0.85);
    expect(output.captured.details[0]!["Desktop Performance"]).toBe(0.92);
  });

  test("handles test without reports", async () => {
    const testResult = sampleTest({ mobile_report: undefined, desktop_report: undefined });
    const { ctx, output } = obsCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return testResult;
      },
    });

    await testsGetRun(["--zone", ZONE_ID, "--id", TEST_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Mobile Performance"]).toBeUndefined();
    expect(output.captured.details[0]!["Desktop Performance"]).toBeUndefined();
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = obsCtx();
    expect(testsGetRun(["--id", TEST_ID], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = obsCtx();
    expect(testsGetRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Tests Delete ───────────────────────────────────────────────────────

describe("observatory tests delete", () => {
  test("deletes tests for a URL with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = obsCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await testsDeleteRun(["--zone", ZONE_ID, "--url", TEST_URL], ctx);

    expect(deletedPath).toContain("speed_api");
    expect(deletedPath).toContain(encodeURIComponent(TEST_URL));
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = obsCtx({}, { yes: undefined });

    await testsDeleteRun(["--zone", ZONE_ID, "--url", TEST_URL], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = obsCtx();
    expect(testsDeleteRun(["--url", TEST_URL], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --url is missing", async () => {
    const { ctx } = obsCtx();
    expect(testsDeleteRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--url");
  });
});

// ─── Schedule List ──────────────────────────────────────────────────────

describe("observatory schedule list", () => {
  test("lists schedules", async () => {
    const schedules = [sampleSchedule(), sampleSchedule({ url: "https://example.com/other" })];
    const { ctx, output } = obsCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return schedules;
      },
    });

    await schedListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = obsCtx();
    expect(schedListRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Schedule Create ────────────────────────────────────────────────────

describe("observatory schedule create", () => {
  test("creates a schedule", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = obsCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return {};
      },
      post: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return sampleSchedule();
      },
    });

    await schedCreateRun(["--zone", ZONE_ID, "--url", TEST_URL], ctx);

    expect(capturedPath).toContain("speed_api/schedule");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("created");
    const body = capturedBody as Record<string, unknown>;
    expect(body["url"]).toBe(TEST_URL);
  });

  test("passes region and frequency", async () => {
    let capturedBody: unknown;
    const { ctx } = obsCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return {};
      },
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleSchedule();
      },
    });

    await schedCreateRun([
      "--zone", ZONE_ID,
      "--url", TEST_URL,
      "--region", "us-east1",
      "--frequency", "WEEKLY",
    ], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["region"]).toBe("us-east1");
    expect(body["frequency"]).toBe("WEEKLY");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = obsCtx();
    expect(schedCreateRun(["--url", TEST_URL], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --url is missing", async () => {
    const { ctx } = obsCtx();
    expect(schedCreateRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--url");
  });
});

// ─── Schedule Delete ────────────────────────────────────────────────────

describe("observatory schedule delete", () => {
  test("deletes a schedule with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = obsCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await schedDeleteRun(["--zone", ZONE_ID, "--url", TEST_URL], ctx);

    expect(deletedPath).toContain("speed_api/schedule");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = obsCtx({}, { yes: undefined });

    await schedDeleteRun(["--zone", ZONE_ID, "--url", TEST_URL], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = obsCtx();
    expect(schedDeleteRun(["--url", TEST_URL], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --url is missing", async () => {
    const { ctx } = obsCtx();
    expect(schedDeleteRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--url");
  });
});

// ─── Routers ────────────────────────────────────────────────────────────

describe("observatory main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown observatory command");
  });

  test("routes 'pages' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["pages"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'tests' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["tests"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'schedule' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["schedule"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("observatory pages router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await pagesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(pagesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown observatory pages command");
  });
});

describe("observatory tests router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await testsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(testsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown observatory tests command");
  });
});

describe("observatory schedule router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await schedRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(schedRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown observatory schedule command");
  });
});
