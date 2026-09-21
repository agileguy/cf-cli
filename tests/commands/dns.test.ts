import { describe, test, expect } from "bun:test";
import { createTestContext, sampleDnsRecord } from "../helpers.js";

import { run as listRun } from "../../src/commands/dns/list.js";
import { run as getRun } from "../../src/commands/dns/get.js";
import { run as createRun } from "../../src/commands/dns/create.js";
import { run as updateRun } from "../../src/commands/dns/update.js";
import { run as patchRun } from "../../src/commands/dns/patch.js";
import { run as deleteRun } from "../../src/commands/dns/delete.js";
import { run as exportRun } from "../../src/commands/dns/export.js";
import { run as routerRun } from "../../src/commands/dns/index.js";

describe("dns list", () => {
  test("lists DNS records for a zone", async () => {
    const records = [sampleDnsRecord(), sampleDnsRecord({ id: "bbb", name: "mail.example.com", type: "MX" })];
    const { ctx, output } = createTestContext({
      get: async () => records,
    });

    await listRun(["--zone", "023e105f4ecef8ad9ca31a8372d0c353"], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(listRun([], ctx)).rejects.toThrow("--zone");
  });

  test("resolves zone name to ID", async () => {
    let capturedPath = "";
    const { ctx } = createTestContext({
      get: async (path: string) => {
        capturedPath = path;
        if (path === "/zones") {
          return [{ id: "023e105f4ecef8ad9ca31a8372d0c353" }];
        }
        return [];
      },
    });

    await listRun(["--zone", "example.com"], ctx);

    expect(capturedPath).toContain("023e105f4ecef8ad9ca31a8372d0c353");
  });

  test("passes type filter", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = createTestContext({
      get: async (_path: string, params?: Record<string, string>) => {
        capturedParams = params;
        return [];
      },
    });

    await listRun(["--zone", "023e105f4ecef8ad9ca31a8372d0c353", "--type", "a"], ctx);

    expect(capturedParams!["type"]).toBe("A"); // uppercased
  });

  test("uses fetchAll when --all flag set", async () => {
    let fetchAllCalled = false;
    const { ctx } = createTestContext({
      fetchAll: async () => {
        fetchAllCalled = true;
        return [];
      },
    });

    await listRun(["--zone", "023e105f4ecef8ad9ca31a8372d0c353", "--all"], ctx);

    expect(fetchAllCalled).toBe(true);
  });
});

describe("dns get", () => {
  test("gets a DNS record", async () => {
    const record = sampleDnsRecord();
    const { ctx, output } = createTestContext({
      get: async () => record,
    });

    await getRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--id", "372e67954025e0ba6aaa6d586b9e0b59",
    ], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Type"]).toBe("A");
  });

  test("throws when --zone missing", async () => {
    const { ctx } = createTestContext();
    expect(getRun(["--id", "abc"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(getRun(["--zone", "023e105f4ecef8ad9ca31a8372d0c353"], ctx)).rejects.toThrow("--id");
  });
});

describe("dns create", () => {
  test("creates a DNS record", async () => {
    const record = sampleDnsRecord();
    let capturedBody: unknown;
    const { ctx, output } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return record;
      },
    });

    await createRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--type", "A",
      "--name", "www.example.com",
      "--content", "1.2.3.4",
    ], ctx);

    expect(output.captured.successes).toHaveLength(1);
    const body = capturedBody as Record<string, unknown>;
    expect(body["type"]).toBe("A");
    expect(body["name"]).toBe("www.example.com");
    expect(body["content"]).toBe("1.2.3.4");
  });

  test("validates record type", async () => {
    const { ctx } = createTestContext();
    expect(createRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--type", "INVALID",
      "--name", "www",
      "--content", "1.2.3.4",
    ], ctx)).rejects.toThrow("Invalid record type");
  });

  test("includes optional fields", async () => {
    let capturedBody: unknown;
    const { ctx } = createTestContext({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleDnsRecord();
      },
    });

    await createRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--type", "MX",
      "--name", "example.com",
      "--content", "mail.example.com",
      "--ttl", "300",
      "--priority", "10",
      "--comment", "Primary MX",
      "--proxied",
    ], ctx);

    const body = capturedBody as Record<string, unknown>;
    expect(body["ttl"]).toBe(300);
    expect(body["priority"]).toBe(10);
    expect(body["comment"]).toBe("Primary MX");
    expect(body["proxied"]).toBe(true);
  });

  test("throws when required fields missing", async () => {
    const { ctx } = createTestContext();
    expect(createRun(["--zone", "abc"], ctx)).rejects.toThrow("--type");
  });
});

describe("dns update", () => {
  test("full updates a DNS record", async () => {
    let capturedBody: unknown;
    let capturedPath = "";
    const { ctx, output } = createTestContext({
      put: async (path: string, body?: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return sampleDnsRecord();
      },
    });

    await updateRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--id", "372e67954025e0ba6aaa6d586b9e0b59",
      "--type", "A",
      "--name", "www.example.com",
      "--content", "5.6.7.8",
    ], ctx);

    expect(capturedPath).toContain("372e67954025e0ba6aaa6d586b9e0b59");
    expect(output.captured.successes).toHaveLength(1);
    expect((capturedBody as Record<string, unknown>)["content"]).toBe("5.6.7.8");
  });

  test("requires all fields for full update", async () => {
    const { ctx } = createTestContext();
    // Missing --content
    expect(updateRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--id", "abc",
      "--type", "A",
      "--name", "www",
    ], ctx)).rejects.toThrow("--content");
  });
});

describe("dns patch", () => {
  test("partial updates a DNS record", async () => {
    let capturedBody: unknown;
    const { ctx, output } = createTestContext({
      patch: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleDnsRecord();
      },
    });

    await patchRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--id", "372e67954025e0ba6aaa6d586b9e0b59",
      "--content", "5.6.7.8",
    ], ctx);

    expect(output.captured.successes).toHaveLength(1);
    const body = capturedBody as Record<string, unknown>;
    expect(body["content"]).toBe("5.6.7.8");
    expect(body["type"]).toBeUndefined(); // partial - not sent
  });

  test("throws when no fields provided", async () => {
    const { ctx } = createTestContext();
    expect(patchRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--id", "abc",
    ], ctx)).rejects.toThrow("At least one field");
  });
});

describe("dns delete", () => {
  test("deletes a DNS record with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return { id: "abc" };
      },
    });

    await deleteRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--id", "372e67954025e0ba6aaa6d586b9e0b59",
    ], ctx);

    expect(deletedPath).toContain("372e67954025e0ba6aaa6d586b9e0b59");
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await deleteRun([
      "--zone", "023e105f4ecef8ad9ca31a8372d0c353",
      "--id", "abc",
    ], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

describe("dns export", () => {
  test("exports DNS records as BIND format to stdout", async () => {
    let capturedPath = "";
    const stdoutWrites: string[] = [];
    const origStdoutWrite = process.stdout.write;
    process.stdout.write = ((chunk: unknown) => {
      stdoutWrites.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;

    try {
      const { ctx } = createTestContext({
        get: async (path: string) => {
          capturedPath = path;
          return ";; Domain: example.com\nexample.com. 300 IN A 1.2.3.4\n";
        },
      });

      await exportRun(["--zone", "023e105f4ecef8ad9ca31a8372d0c353"], ctx);

      expect(capturedPath).toBe("/zones/023e105f4ecef8ad9ca31a8372d0c353/dns_records/export");
      expect(stdoutWrites.join("")).toContain("Domain: example.com");
      expect(stdoutWrites.join("")).toContain("example.com. 300 IN A 1.2.3.4");
    } finally {
      process.stdout.write = origStdoutWrite;
    }
  });

  test("resolves zone name to ID for export", async () => {
    let capturedPath = "";
    const origStdoutWrite = process.stdout.write;
    process.stdout.write = (() => true) as typeof process.stdout.write;

    try {
      const { ctx } = createTestContext({
        get: async (path: string) => {
          if (path === "/zones") return [{ id: "023e105f4ecef8ad9ca31a8372d0c353" }];
          capturedPath = path;
          return ";; BIND format";
        },
      });

      await exportRun(["--zone", "example.com"], ctx);

      expect(capturedPath).toBe("/zones/023e105f4ecef8ad9ca31a8372d0c353/dns_records/export");
    } finally {
      process.stdout.write = origStdoutWrite;
    }
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = createTestContext();
    expect(exportRun([], ctx)).rejects.toThrow("--zone");
  });
});

describe("dns router", () => {
  test("routes to list", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["list", "--zone", "023e105f4ecef8ad9ca31a8372d0c353"], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("routes with aliases", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["ls", "--zone", "023e105f4ecef8ad9ca31a8372d0c353"], ctx);
    expect(output.captured.infos.length + output.captured.tables.length).toBeGreaterThanOrEqual(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown dns command");
  });
});
