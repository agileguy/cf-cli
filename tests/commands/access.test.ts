import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Access router
import { run as accessRouterRun } from "../../src/commands/access/index.js";

// Access apps
import { run as appsListRun } from "../../src/commands/access/apps/list.js";
import { run as appsGetRun } from "../../src/commands/access/apps/get.js";
import { run as appsCreateRun } from "../../src/commands/access/apps/create.js";
import { run as appsUpdateRun } from "../../src/commands/access/apps/update.js";
import { run as appsDeleteRun } from "../../src/commands/access/apps/delete.js";
import { run as appsRouterRun } from "../../src/commands/access/apps/index.js";

// Access policies
import { run as policiesListRun } from "../../src/commands/access/policies/list.js";
import { run as policiesGetRun } from "../../src/commands/access/policies/get.js";
import { run as policiesCreateRun } from "../../src/commands/access/policies/create.js";
import { run as policiesUpdateRun } from "../../src/commands/access/policies/update.js";
import { run as policiesDeleteRun } from "../../src/commands/access/policies/delete.js";
import { run as policiesRouterRun } from "../../src/commands/access/policies/index.js";

// Access service tokens
import { run as tokensListRun } from "../../src/commands/access/service-tokens/list.js";
import { run as tokensCreateRun } from "../../src/commands/access/service-tokens/create.js";
import { run as tokensUpdateRun } from "../../src/commands/access/service-tokens/update.js";
import { run as tokensDeleteRun } from "../../src/commands/access/service-tokens/delete.js";
import { run as tokensRotateRun } from "../../src/commands/access/service-tokens/rotate.js";
import { run as tokensRouterRun } from "../../src/commands/access/service-tokens/index.js";

// Access groups
import { run as groupsListRun } from "../../src/commands/access/groups/list.js";
import { run as groupsGetRun } from "../../src/commands/access/groups/get.js";
import { run as groupsCreateRun } from "../../src/commands/access/groups/create.js";
import { run as groupsUpdateRun } from "../../src/commands/access/groups/update.js";
import { run as groupsDeleteRun } from "../../src/commands/access/groups/delete.js";
import { run as groupsRouterRun } from "../../src/commands/access/groups/index.js";

// Access users
import { run as usersListRun } from "../../src/commands/access/users/list.js";
import { run as usersSessionsRun } from "../../src/commands/access/users/sessions.js";
import { run as usersActiveSessionsRun } from "../../src/commands/access/users/active-sessions.js";
import { run as usersRouterRun } from "../../src/commands/access/users/index.js";

// Access certificates
import { run as certsListRun } from "../../src/commands/access/certificates/list.js";
import { run as certsCreateRun } from "../../src/commands/access/certificates/create.js";
import { run as certsDeleteRun } from "../../src/commands/access/certificates/delete.js";
import { run as certsRouterRun } from "../../src/commands/access/certificates/index.js";

// Access identity providers
import { run as idpsListRun } from "../../src/commands/access/idps/list.js";
import { run as idpsGetRun } from "../../src/commands/access/idps/get.js";
import { run as idpsCreateRun } from "../../src/commands/access/idps/create.js";
import { run as idpsUpdateRun } from "../../src/commands/access/idps/update.js";
import { run as idpsDeleteRun } from "../../src/commands/access/idps/delete.js";
import { run as idpsRouterRun } from "../../src/commands/access/idps/index.js";

const ACCOUNT_ID = "acc-uuid-123";
const APP_ID = "app-uuid-456";
const POLICY_ID = "pol-uuid-789";
const TOKEN_ID = "tok-uuid-111";
const GROUP_ID = "grp-uuid-222";
const USER_ID = "usr-uuid-333";
const CERT_ID = "cert-uuid-444";
const IDP_ID = "idp-uuid-555";
const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";

function sampleApp(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: APP_ID,
    name: "My App",
    domain: "app.example.com",
    type: "self_hosted",
    session_duration: "24h",
    created_at: "2024-06-01T12:00:00.000Z",
    updated_at: "2024-06-01T12:00:00.000Z",
    aud: "aud-token-123",
    ...overrides,
  };
}

function samplePolicy(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: POLICY_ID,
    name: "Allow Engineers",
    decision: "allow",
    precedence: 1,
    include: [{ email_domain: { domain: "example.com" } }],
    exclude: [],
    require: [],
    created_at: "2024-06-01T12:00:00.000Z",
    updated_at: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleServiceToken(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: TOKEN_ID,
    name: "CI Token",
    client_id: "client-id-abc",
    client_secret: "client-secret-xyz",
    created_at: "2024-06-01T12:00:00.000Z",
    expires_at: "2025-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleGroup(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: GROUP_ID,
    name: "Engineering",
    include: [{ email_domain: { domain: "example.com" } }],
    exclude: [],
    require: [],
    created_at: "2024-06-01T12:00:00.000Z",
    updated_at: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleAccessUser(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: USER_ID,
    name: "Test User",
    email: "test@example.com",
    access_seat: true,
    gateway_seat: false,
    last_successful_login: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleCertificate(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: CERT_ID,
    name: "mTLS Cert",
    fingerprint: "abc123def456",
    associated_hostnames: ["api.example.com"],
    created_at: "2024-06-01T12:00:00.000Z",
    expires_on: "2025-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleIdp(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: IDP_ID,
    name: "Okta SSO",
    type: "okta",
    config: { client_id: "okta-client-id" },
    created_at: "2024-06-01T12:00:00.000Z",
    updated_at: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

// ─── Access Apps ─────────────────────────────────────────────────────────

describe("access apps list", () => {
  test("lists apps for an account", async () => {
    const apps = [sampleApp(), sampleApp({ id: "app-2", name: "Other" })];
    const { ctx, output } = createTestContext({
      get: async () => apps,
    });

    await appsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("lists apps for a zone", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [sampleApp()],
    });

    await appsListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
  });

  test("throws when neither --zone nor --account-id", async () => {
    const { ctx } = createTestContext();
    expect(appsListRun([], ctx)).rejects.toThrow("--zone");
  });

  test("throws when both --zone and --account-id", async () => {
    const { ctx } = createTestContext();
    expect(appsListRun(["--zone", ZONE_ID, "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("not both");
  });
});

describe("access apps get", () => {
  test("gets an app", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleApp(),
    });

    await appsGetRun(["--account-id", ACCOUNT_ID, "--id", APP_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("My App");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(appsGetRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("access apps create", () => {
  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(appsCreateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("access apps update", () => {
  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(appsUpdateRun(["--account-id", ACCOUNT_ID, "--file", "x.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(appsUpdateRun(["--account-id", ACCOUNT_ID, "--id", APP_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("access apps delete", () => {
  test("deletes an app with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return undefined;
      },
    });

    await appsDeleteRun(["--account-id", ACCOUNT_ID, "--id", APP_ID], ctx);

    expect(deletedPath).toContain(APP_ID);
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await appsDeleteRun(["--account-id", ACCOUNT_ID, "--id", APP_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(appsDeleteRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("access apps router", () => {
  test("routes to list", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await appsRouterRun(["list", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await appsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(appsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown access apps command");
  });
});

// ─── Access Policies ─────────────────────────────────────────────────────

describe("access policies list", () => {
  test("lists policies for an app", async () => {
    const policies = [samplePolicy(), samplePolicy({ id: "pol-2", name: "Block" })];
    const { ctx, output } = createTestContext({
      get: async () => policies,
    });

    await policiesListRun(["--account-id", ACCOUNT_ID, "--app", APP_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --app missing", async () => {
    const { ctx } = createTestContext();
    expect(policiesListRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--app");
  });
});

describe("access policies get", () => {
  test("gets a policy", async () => {
    const { ctx, output } = createTestContext({
      get: async () => samplePolicy(),
    });

    await policiesGetRun(["--account-id", ACCOUNT_ID, "--app", APP_ID, "--id", POLICY_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("Allow Engineers");
  });

  test("throws when --app missing", async () => {
    const { ctx } = createTestContext();
    expect(policiesGetRun(["--account-id", ACCOUNT_ID, "--id", POLICY_ID], ctx)).rejects.toThrow("--app");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(policiesGetRun(["--account-id", ACCOUNT_ID, "--app", APP_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("access policies create", () => {
  test("throws when --app missing", async () => {
    const { ctx } = createTestContext();
    expect(policiesCreateRun(["--account-id", ACCOUNT_ID, "--file", "x.json"], ctx)).rejects.toThrow("--app");
  });

  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(policiesCreateRun(["--account-id", ACCOUNT_ID, "--app", APP_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("access policies update", () => {
  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(policiesUpdateRun(["--account-id", ACCOUNT_ID, "--app", APP_ID, "--file", "x.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(policiesUpdateRun(["--account-id", ACCOUNT_ID, "--app", APP_ID, "--id", POLICY_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("access policies delete", () => {
  test("deletes a policy with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return undefined;
      },
    });

    await policiesDeleteRun(["--account-id", ACCOUNT_ID, "--app", APP_ID, "--id", POLICY_ID], ctx);

    expect(deletedPath).toContain(POLICY_ID);
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await policiesDeleteRun(["--account-id", ACCOUNT_ID, "--app", APP_ID, "--id", POLICY_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

describe("access policies router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await policiesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(policiesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown access policies command");
  });
});

// ─── Access Service Tokens ────────────────────────────────────────────────

describe("access service-tokens list", () => {
  test("lists tokens", async () => {
    const tokens = [sampleServiceToken(), sampleServiceToken({ id: "tok-2", name: "Other" })];
    const { ctx, output } = createTestContext({
      get: async () => tokens,
    });

    await tokensListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("access service-tokens create", () => {
  test("creates a token", async () => {
    const { ctx, output } = createTestContext({
      post: async () => sampleServiceToken(),
    });

    await tokensCreateRun(["--account-id", ACCOUNT_ID, "--name", "CI Token"], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("CI Token");
  });

  test("throws when --name missing", async () => {
    const { ctx } = createTestContext();
    expect(tokensCreateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--name");
  });
});

describe("access service-tokens update", () => {
  test("updates a token", async () => {
    const { ctx, output } = createTestContext({
      put: async () => sampleServiceToken({ name: "Updated" }),
    });

    await tokensUpdateRun(["--account-id", ACCOUNT_ID, "--id", TOKEN_ID, "--name", "Updated"], ctx);

    expect(output.captured.successes).toHaveLength(1);
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(tokensUpdateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("access service-tokens delete", () => {
  test("deletes a token with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return undefined;
      },
    });

    await tokensDeleteRun(["--account-id", ACCOUNT_ID, "--id", TOKEN_ID], ctx);

    expect(deletedPath).toContain(TOKEN_ID);
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await tokensDeleteRun(["--account-id", ACCOUNT_ID, "--id", TOKEN_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

describe("access service-tokens rotate", () => {
  test("rotates a token", async () => {
    const { ctx, output } = createTestContext({
      post: async () => sampleServiceToken({ client_secret: "new-secret" }),
    });

    await tokensRotateRun(["--account-id", ACCOUNT_ID, "--id", TOKEN_ID], ctx);

    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("rotated");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(tokensRotateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("access service-tokens router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await tokensRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(tokensRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown access service-tokens command");
  });
});

// ─── Access Groups ────────────────────────────────────────────────────────

describe("access groups list", () => {
  test("lists groups", async () => {
    const groups = [sampleGroup(), sampleGroup({ id: "grp-2", name: "Product" })];
    const { ctx, output } = createTestContext({
      get: async () => groups,
    });

    await groupsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("access groups get", () => {
  test("gets a group", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleGroup(),
    });

    await groupsGetRun(["--account-id", ACCOUNT_ID, "--id", GROUP_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("Engineering");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(groupsGetRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("access groups create", () => {
  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(groupsCreateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("access groups update", () => {
  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(groupsUpdateRun(["--account-id", ACCOUNT_ID, "--file", "x.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(groupsUpdateRun(["--account-id", ACCOUNT_ID, "--id", GROUP_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("access groups delete", () => {
  test("deletes a group with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return undefined;
      },
    });

    await groupsDeleteRun(["--account-id", ACCOUNT_ID, "--id", GROUP_ID], ctx);

    expect(deletedPath).toContain(GROUP_ID);
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await groupsDeleteRun(["--account-id", ACCOUNT_ID, "--id", GROUP_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

describe("access groups router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await groupsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(groupsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown access groups command");
  });
});

// ─── Access Users ─────────────────────────────────────────────────────────

describe("access users list", () => {
  test("lists users", async () => {
    const users = [sampleAccessUser(), sampleAccessUser({ id: "usr-2", name: "Other" })];
    const { ctx, output } = createTestContext({
      get: async () => users,
    });

    await usersListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("access users sessions", () => {
  test("lists user sessions", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [{ email: "test@example.com", ip: "1.2.3.4" }],
    });

    await usersSessionsRun(["--account-id", ACCOUNT_ID, "--user-id", USER_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("throws when --user-id missing", async () => {
    const { ctx } = createTestContext();
    expect(usersSessionsRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--user-id");
  });
});

describe("access users active-sessions", () => {
  test("lists active sessions", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [{ email: "test@example.com", is_warp: true }],
    });

    await usersActiveSessionsRun(["--account-id", ACCOUNT_ID, "--user-id", USER_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });

  test("throws when --user-id missing", async () => {
    const { ctx } = createTestContext();
    expect(usersActiveSessionsRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--user-id");
  });
});

describe("access users router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await usersRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(usersRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown access users command");
  });
});

// ─── Access Certificates ──────────────────────────────────────────────────

describe("access certificates list", () => {
  test("lists certificates", async () => {
    const certs = [sampleCertificate(), sampleCertificate({ id: "cert-2", name: "Other" })];
    const { ctx, output } = createTestContext({
      get: async () => certs,
    });

    await certsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("access certificates create", () => {
  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(certsCreateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("access certificates delete", () => {
  test("deletes a certificate with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return undefined;
      },
    });

    await certsDeleteRun(["--account-id", ACCOUNT_ID, "--id", CERT_ID], ctx);

    expect(deletedPath).toContain(CERT_ID);
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await certsDeleteRun(["--account-id", ACCOUNT_ID, "--id", CERT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(certsDeleteRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("access certificates router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await certsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(certsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown access certificates command");
  });
});

// ─── Access Identity Providers ────────────────────────────────────────────

describe("access idps list", () => {
  test("lists identity providers", async () => {
    const idps = [sampleIdp(), sampleIdp({ id: "idp-2", name: "Azure AD" })];
    const { ctx, output } = createTestContext({
      get: async () => idps,
    });

    await idpsListRun(["--account-id", ACCOUNT_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("access idps get", () => {
  test("gets an identity provider", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleIdp(),
    });

    await idpsGetRun(["--account-id", ACCOUNT_ID, "--id", IDP_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("Okta SSO");
    expect(output.captured.jsons).toHaveLength(1); // config output
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(idpsGetRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("access idps create", () => {
  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(idpsCreateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("access idps update", () => {
  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(idpsUpdateRun(["--account-id", ACCOUNT_ID, "--file", "x.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(idpsUpdateRun(["--account-id", ACCOUNT_ID, "--id", IDP_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("access idps delete", () => {
  test("deletes an identity provider with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return undefined;
      },
    });

    await idpsDeleteRun(["--account-id", ACCOUNT_ID, "--id", IDP_ID], ctx);

    expect(deletedPath).toContain(IDP_ID);
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await idpsDeleteRun(["--account-id", ACCOUNT_ID, "--id", IDP_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

describe("access idps router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await idpsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(idpsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown access idps command");
  });
});

// ─── Access Main Router ──────────────────────────────────────────────────

describe("access router", () => {
  test("routes to apps", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await accessRouterRun(["apps", "list", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes to policies", async () => {
    const { ctx, output } = createTestContext();
    await accessRouterRun(["policies"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to service-tokens", async () => {
    const { ctx, output } = createTestContext();
    await accessRouterRun(["service-tokens"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to groups", async () => {
    const { ctx, output } = createTestContext();
    await accessRouterRun(["groups"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to users", async () => {
    const { ctx, output } = createTestContext();
    await accessRouterRun(["users"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to certificates", async () => {
    const { ctx, output } = createTestContext();
    await accessRouterRun(["certificates"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes to idps", async () => {
    const { ctx, output } = createTestContext();
    await accessRouterRun(["idps"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await accessRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(accessRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown access command");
  });
});
