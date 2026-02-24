import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// SSL command runners
import { run as analyzeRun } from "../../src/commands/ssl/analyze.js";
import { run as universalRun } from "../../src/commands/ssl/universal.js";
import { run as advancedRun } from "../../src/commands/ssl/advanced.js";
import { run as customRun } from "../../src/commands/ssl/custom.js";
import { run as clientCertsRun } from "../../src/commands/ssl/client-certs.js";
import { run as keylessRun } from "../../src/commands/ssl/keyless.js";
import { run as originCaRun } from "../../src/commands/ssl/origin-ca.js";
import { run as mtlsRun } from "../../src/commands/ssl/mtls.js";
import { run as verificationRun } from "../../src/commands/ssl/verification.js";
import { run as dcvDelegationRun } from "../../src/commands/ssl/dcv-delegation.js";
import { run as recommendationsRun } from "../../src/commands/ssl/recommendations.js";
import { run as postQuantumRun } from "../../src/commands/ssl/post-quantum.js";

// Routers
import { run as mainRouterRun } from "../../src/commands/ssl/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";
const CERT_ID = "cert-uuid-123";
const ACCOUNT_ID = "abc123def456abc123def456abc12345";

function zoneCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
  return createTestContext(
    clientOverrides as Record<string, unknown>,
    flagOverrides,
  );
}

// ─── SSL Router ──────────────────────────────────────────────────────────

describe("ssl main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown ssl command");
  });
});

// ─── SSL Analyze ────────────────────────────────────────────────────────

describe("ssl analyze", () => {
  test("analyzes SSL for a hostname", async () => {
    const result = {
      hostname: "example.com",
      certificate_status: "active",
      certificate_authority: "DigiCert",
      valid_from: "2024-01-01",
      valid_to: "2025-01-01",
      signature_algorithm: "SHA256WithRSA",
      issuer: "DigiCert Inc",
      sans: ["example.com", "*.example.com"],
    };
    const { ctx, output } = zoneCtx({
      post: async () => result,
    });

    await analyzeRun(["--zone", ZONE_ID, "--hostname", "example.com"], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Hostname"]).toBe("example.com");
    expect(output.captured.details[0]!["Status"]).toBe("active");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zoneCtx();
    expect(analyzeRun(["--hostname", "example.com"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --hostname is missing", async () => {
    const { ctx } = zoneCtx();
    expect(analyzeRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--hostname");
  });
});

// ─── SSL Universal ──────────────────────────────────────────────────────

describe("ssl universal", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await universalRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("gets universal SSL settings", async () => {
    const { ctx, output } = zoneCtx({
      get: async () => ({ enabled: true }),
    });

    await universalRun(["get", "--zone", ZONE_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Enabled"]).toBe(true);
  });

  test("updates universal SSL settings", async () => {
    let capturedBody: unknown;
    const { ctx, output } = zoneCtx({
      patch: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { enabled: true };
      },
    });

    await universalRun(["update", "--zone", ZONE_ID, "--enabled"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("enabled");
    const body = capturedBody as Record<string, unknown>;
    expect(body["enabled"]).toBe(true);
  });

  test("throws on unknown action", async () => {
    const { ctx } = createTestContext();
    expect(universalRun(["unknown"], ctx)).rejects.toThrow("Unknown ssl universal action");
  });
});

// ─── SSL Advanced ───────────────────────────────────────────────────────

describe("ssl advanced", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await advancedRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("lists advanced certificate packs", async () => {
    const packs = [
      { id: "pack-1", type: "advanced", hosts: ["*.example.com"], status: "active" },
      { id: "pack-2", type: "advanced", hosts: ["api.example.com"], status: "pending" },
    ];
    const { ctx, output } = zoneCtx({
      get: async () => packs,
    });

    await advancedRun(["list", "--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("orders an advanced certificate pack", async () => {
    let capturedBody: unknown;
    const pack = { id: "new-pack", status: "pending", hosts: ["example.com"], validity_days: 365, certificate_authority: "lets_encrypt" };
    const { ctx, output } = zoneCtx({
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return pack;
      },
    });

    await advancedRun(["order", "--zone", ZONE_ID, "--hosts", "example.com,www.example.com"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("ordered");
    const body = capturedBody as Record<string, unknown>;
    expect(body["hosts"]).toEqual(["example.com", "www.example.com"]);
    expect(body["type"]).toBe("advanced");
  });

  test("throws when --hosts is missing for order", async () => {
    const { ctx } = zoneCtx();
    expect(advancedRun(["order", "--zone", ZONE_ID], ctx)).rejects.toThrow("--hosts");
  });
});

// ─── SSL Custom ─────────────────────────────────────────────────────────

describe("ssl custom", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await customRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("lists custom certificates", async () => {
    const certs = [
      { id: CERT_ID, hosts: ["example.com"], issuer: "DigiCert", status: "active", signature: "sha256", bundle_method: "ubiquitous", zone_id: ZONE_ID, uploaded_on: "2024-01-01", modified_on: "2024-01-01", expires_on: "2025-01-01" },
    ];
    const { ctx, output } = zoneCtx({
      get: async () => certs,
    });

    await customRun(["list", "--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });

  test("gets a custom certificate", async () => {
    const cert = { id: CERT_ID, hosts: ["example.com"], issuer: "DigiCert", signature: "sha256", status: "active", bundle_method: "ubiquitous", zone_id: ZONE_ID, uploaded_on: "2024-01-01", modified_on: "2024-01-01", expires_on: "2025-01-01" };
    const { ctx, output } = zoneCtx({
      get: async () => cert,
    });

    await customRun(["get", "--zone", ZONE_ID, "--id", CERT_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe(CERT_ID);
  });

  test("throws when --id is missing for get", async () => {
    const { ctx } = zoneCtx();
    expect(customRun(["get", "--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });

  test("throws when --cert is missing for upload", async () => {
    const { ctx } = zoneCtx();
    expect(customRun(["upload", "--zone", ZONE_ID, "--key", "/tmp/key.pem"], ctx)).rejects.toThrow("--cert");
  });

  test("throws when --key is missing for upload", async () => {
    const { ctx } = zoneCtx();
    expect(customRun(["upload", "--zone", ZONE_ID, "--cert", "/tmp/cert.pem"], ctx)).rejects.toThrow("--key");
  });

  test("throws when cert file does not exist for upload", async () => {
    const { ctx } = zoneCtx();
    expect(customRun(["upload", "--zone", ZONE_ID, "--cert", "/tmp/nonexistent-cf-cli-cert.pem", "--key", "/tmp/key.pem"], ctx)).rejects.toThrow("Cannot read file");
  });

  test("deletes a custom certificate with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = zoneCtx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await customRun(["delete", "--zone", ZONE_ID, "--id", CERT_ID], ctx);

    expect(deletedPath).toContain(CERT_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts delete when confirmation denied", async () => {
    const { ctx, output } = zoneCtx({}, { yes: undefined });

    await customRun(["delete", "--zone", ZONE_ID, "--id", CERT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id is missing for delete", async () => {
    const { ctx } = zoneCtx();
    expect(customRun(["delete", "--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });

  test("throws when neither --cert nor --key for update", async () => {
    const { ctx } = zoneCtx();
    expect(customRun(["update", "--zone", ZONE_ID, "--id", CERT_ID], ctx)).rejects.toThrow("--cert or --key");
  });
});

// ─── SSL Client Certs ───────────────────────────────────────────────────

describe("ssl client-certs", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await clientCertsRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("lists client certificates", async () => {
    const certs = [
      { id: CERT_ID, certificate: "...", status: "active", expires_on: "2025-01-01" },
    ];
    const { ctx, output } = zoneCtx({
      get: async () => certs,
    });

    await clientCertsRun(["list", "--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
  });

  test("throws when --csr is missing for create", async () => {
    const { ctx } = zoneCtx();
    expect(clientCertsRun(["create", "--zone", ZONE_ID], ctx)).rejects.toThrow("--csr");
  });

  test("throws when csr file does not exist", async () => {
    const { ctx } = zoneCtx();
    expect(clientCertsRun(["create", "--zone", ZONE_ID, "--csr", "/tmp/nonexistent-cf-cli-csr.pem"], ctx)).rejects.toThrow("Cannot read file");
  });

  test("deletes a client certificate with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = zoneCtx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await clientCertsRun(["delete", "--zone", ZONE_ID, "--id", CERT_ID], ctx);

    expect(deletedPath).toContain(CERT_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts delete when confirmation denied", async () => {
    const { ctx, output } = zoneCtx({}, { yes: undefined });

    await clientCertsRun(["delete", "--zone", ZONE_ID, "--id", CERT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

// ─── SSL Keyless ────────────────────────────────────────────────────────

describe("ssl keyless", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await keylessRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("lists keyless SSL servers", async () => {
    const servers = [
      { id: "kl-1", name: "keyless-1", host: "kl.example.com", port: 2407, status: "active", enabled: true },
    ];
    const { ctx, output } = zoneCtx({
      get: async () => servers,
    });

    await keylessRun(["list", "--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
  });

  test("throws when --host is missing for create", async () => {
    const { ctx } = zoneCtx();
    expect(keylessRun(["create", "--zone", ZONE_ID, "--port", "2407", "--certificate", "/tmp/cert.pem"], ctx)).rejects.toThrow("--host");
  });

  test("throws when --port is missing for create", async () => {
    const { ctx } = zoneCtx();
    expect(keylessRun(["create", "--zone", ZONE_ID, "--host", "kl.example.com", "--certificate", "/tmp/cert.pem"], ctx)).rejects.toThrow("--port");
  });

  test("throws when --certificate is missing for create", async () => {
    const { ctx } = zoneCtx();
    expect(keylessRun(["create", "--zone", ZONE_ID, "--host", "kl.example.com", "--port", "2407"], ctx)).rejects.toThrow("--certificate");
  });

  test("deletes a keyless SSL server with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = zoneCtx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await keylessRun(["delete", "--zone", ZONE_ID, "--id", "kl-1"], ctx);

    expect(deletedPath).toContain("kl-1");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });
});

// ─── SSL Origin CA ──────────────────────────────────────────────────────

describe("ssl origin-ca", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await originCaRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("lists origin CA certificates", async () => {
    const certs = [
      { id: "oca-1", hostnames: ["example.com"], request_type: "origin-rsa", expires_on: "2030-01-01", certificate: "...", requested_validity: 5475 },
    ];
    const { ctx, output } = zoneCtx({
      get: async () => certs,
    });

    await originCaRun(["list"], ctx);

    expect(output.captured.tables).toHaveLength(1);
  });

  test("gets an origin CA certificate", async () => {
    const cert = { id: "oca-1", hostnames: ["example.com"], request_type: "origin-rsa", expires_on: "2030-01-01", certificate: "...", requested_validity: 5475 };
    const { ctx, output } = zoneCtx({
      get: async () => cert,
    });

    await originCaRun(["get", "--id", "oca-1"], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe("oca-1");
  });

  test("throws when --id is missing for get", async () => {
    const { ctx } = zoneCtx();
    expect(originCaRun(["get"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --csr is missing for create", async () => {
    const { ctx } = zoneCtx();
    expect(originCaRun(["create", "--hostnames", "example.com"], ctx)).rejects.toThrow("--csr");
  });

  test("throws when --hostnames is missing for create", async () => {
    const { ctx } = zoneCtx();
    expect(originCaRun(["create", "--csr", "/tmp/csr.pem"], ctx)).rejects.toThrow("--hostnames");
  });

  test("revokes a certificate with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = zoneCtx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await originCaRun(["revoke", "--id", "oca-1"], ctx);

    expect(deletedPath).toContain("oca-1");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("revoked");
  });

  test("aborts revoke when confirmation denied", async () => {
    const { ctx, output } = zoneCtx({}, { yes: undefined });

    await originCaRun(["revoke", "--id", "oca-1"], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

// ─── SSL mTLS ───────────────────────────────────────────────────────────

describe("ssl mtls", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mtlsRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("lists mTLS certificates", async () => {
    const certs = [
      { id: "mtls-1", name: "My CA", issuer: "DigiCert", expires_on: "2025-01-01" },
    ];
    const { ctx, output } = zoneCtx({
      get: async () => certs,
    });

    await mtlsRun(["list", "--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
  });

  test("throws when --account-id is missing for list", async () => {
    const { ctx } = zoneCtx();
    expect(mtlsRun(["list"], ctx)).rejects.toThrow("--account-id");
  });

  test("throws when --cert is missing for upload", async () => {
    const { ctx } = zoneCtx();
    expect(mtlsRun(["upload", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--cert");
  });

  test("throws when cert file does not exist for upload", async () => {
    const { ctx } = zoneCtx();
    expect(mtlsRun(["upload", "--account-id", ACCOUNT_ID, "--cert", "/tmp/nonexistent-cf-cli-mtls.pem"], ctx)).rejects.toThrow("Cannot read file");
  });

  test("deletes mTLS certificate with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = zoneCtx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await mtlsRun(["delete", "--account-id", ACCOUNT_ID, "--id", "mtls-1"], ctx);

    expect(deletedPath).toContain("mtls-1");
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts delete when confirmation denied", async () => {
    const { ctx, output } = zoneCtx({}, { yes: undefined });

    await mtlsRun(["delete", "--account-id", ACCOUNT_ID, "--id", "mtls-1"], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

// ─── SSL Verification ───────────────────────────────────────────────────

describe("ssl verification", () => {
  test("gets SSL verification", async () => {
    const verifications = [
      { certificate_status: "active", hostname: "example.com", validation_method: "txt", verification_type: "dv", cert_pack_uuid: "uuid-1" },
    ];
    const { ctx, output } = zoneCtx({
      get: async () => verifications,
    });

    await verificationRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zoneCtx();
    expect(verificationRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── SSL DCV Delegation ────────────────────────────────────────────────

describe("ssl dcv-delegation", () => {
  test("lists DCV delegation UUIDs", async () => {
    const delegations = [{ uuid: "delegation-uuid-1" }];
    const { ctx, output } = zoneCtx({
      get: async () => delegations,
    });

    await dcvDelegationRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["UUID"]).toBe("delegation-uuid-1");
  });

  test("shows info when no delegations", async () => {
    const { ctx, output } = zoneCtx({
      get: async () => [],
    });

    await dcvDelegationRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.infos[0]).toContain("No DCV delegation");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zoneCtx();
    expect(dcvDelegationRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── SSL Recommendations ───────────────────────────────────────────────

describe("ssl recommendations", () => {
  test("gets SSL recommendations", async () => {
    const recommendation = { id: "ssl_recommendation", value: "strict", modified_on: "2024-01-01" };
    const { ctx, output } = zoneCtx({
      get: async () => recommendation,
    });

    await recommendationsRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Recommended Mode"]).toBe("strict");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = zoneCtx();
    expect(recommendationsRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── SSL Post-Quantum ──────────────────────────────────────────────────

describe("ssl post-quantum", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await postQuantumRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("gets post-quantum setting", async () => {
    const { ctx, output } = zoneCtx({
      get: async () => ({ value: "preferred", modified_on: "2024-01-01" }),
    });

    await postQuantumRun(["get", "--zone", ZONE_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Value"]).toBe("preferred");
  });

  test("updates post-quantum setting", async () => {
    let capturedBody: unknown;
    const { ctx, output } = zoneCtx({
      patch: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return { value: "default" };
      },
    });

    await postQuantumRun(["update", "--zone", ZONE_ID, "--value", "default"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    const body = capturedBody as Record<string, unknown>;
    expect(body["value"]).toBe("default");
  });

  test("throws when --value is invalid for update", async () => {
    const { ctx } = zoneCtx();
    expect(postQuantumRun(["update", "--zone", ZONE_ID, "--value", "invalid"], ctx)).rejects.toThrow("--value");
  });

  test("throws when --value is missing for update", async () => {
    const { ctx } = zoneCtx();
    expect(postQuantumRun(["update", "--zone", ZONE_ID], ctx)).rejects.toThrow("--value");
  });
});
