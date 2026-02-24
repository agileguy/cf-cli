import { describe, test, expect, spyOn } from "bun:test";
import { createTestContext } from "../helpers.js";

import { run as routerRun } from "../../src/commands/accounts/index.js";
import { run as membersRouterRun } from "../../src/commands/accounts/members/index.js";
import { run as membersListRun } from "../../src/commands/accounts/members/list.js";
import { run as membersGetRun } from "../../src/commands/accounts/members/get.js";
import { run as membersAddRun } from "../../src/commands/accounts/members/add.js";
import { run as membersUpdateRun } from "../../src/commands/accounts/members/update.js";
import { run as membersRemoveRun } from "../../src/commands/accounts/members/remove.js";
import { run as rolesRouterRun } from "../../src/commands/accounts/roles/index.js";
import { run as rolesListRun } from "../../src/commands/accounts/roles/list.js";
import { run as rolesGetRun } from "../../src/commands/accounts/roles/get.js";

const prompts = await import("../../src/utils/prompts.js");

const sampleMember = () => ({
  id: "member-uuid-123",
  user: {
    id: "user-uuid-123",
    email: "user@example.com",
    first_name: "Test",
    last_name: "User",
    two_factor_authentication_enabled: true,
  },
  status: "accepted",
  roles: [
    {
      id: "role-uuid-123",
      name: "Administrator",
      description: "Full access",
      permissions: { zone: { read: true, edit: true } },
    },
  ],
});

const sampleRole = () => ({
  id: "role-uuid-123",
  name: "Administrator",
  description: "Full access to account resources",
  permissions: {
    zone: { read: true, edit: true },
    dns_records: { read: true, edit: true },
  },
});

// Helper: account lookup mock
const accountGet = (returnVal: unknown) => async (path: string) => {
  if (path === "/accounts") return [{ id: "acct-123", name: "Test" }];
  return returnVal;
};

// ─── Accounts Router (extended) ────────────────────────────────────────────

describe("accounts router (extended)", () => {
  test("routes to members", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet([sampleMember()]),
    });
    await routerRun(["members", "list", "--account-id", "acct-123"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes to roles", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet([sampleRole()]),
    });
    await routerRun(["roles", "list", "--account-id", "acct-123"], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });
});

// ─── Members Router ────────────────────────────────────────────────────────

describe("accounts members router", () => {
  test("shows help", async () => {
    const { ctx, output } = createTestContext();
    await membersRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("unknown command throws", async () => {
    const { ctx } = createTestContext();
    expect(membersRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown");
  });
});

// ─── Members CRUD ──────────────────────────────────────────────────────────

describe("accounts members list", () => {
  test("returns table of members", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet([sampleMember()]),
    });
    await membersListRun(["--account-id", "acct-123"], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });
});

describe("accounts members get", () => {
  test("requires --id", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(membersGetRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--id");
  });

  test("returns member details", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet(sampleMember()),
    });
    await membersGetRun(["--account-id", "acct-123", "--id", "member-1"], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Email"]).toBe("user@example.com");
    expect(output.captured.details[0]!["Roles"]).toBe("Administrator");
  });
});

describe("accounts members add", () => {
  test("requires --email and --roles", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(membersAddRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--email");
    expect(
      membersAddRun(["--account-id", "acct-123", "--email", "user@test.com"], ctx),
    ).rejects.toThrow("--roles");
  });

  test("adds member successfully", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [{ id: "acct-123" }],
      post: async () => sampleMember(),
    });
    await membersAddRun([
      "--account-id", "acct-123",
      "--email", "user@example.com",
      "--roles", "role-uuid-123",
    ], ctx);
    expect(output.captured.successes[0]).toContain("Member added");
  });

  test("posts correct body with multiple roles", async () => {
    let capturedBody: unknown;
    const { ctx } = createTestContext({
      get: async () => [{ id: "acct-123" }],
      post: async (_path: string, body?: unknown) => {
        capturedBody = body;
        return sampleMember();
      },
    });
    await membersAddRun([
      "--account-id", "acct-123",
      "--email", "user@test.com",
      "--roles", "role-1,role-2",
    ], ctx);
    const body = capturedBody as { roles: { id: string }[] };
    expect(body.roles).toHaveLength(2);
    expect(body.roles[0]!.id).toBe("role-1");
    expect(body.roles[1]!.id).toBe("role-2");
  });
});

describe("accounts members update", () => {
  test("requires --id and --roles", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(membersUpdateRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--id");
    expect(
      membersUpdateRun(["--account-id", "acct-123", "--id", "m-1"], ctx),
    ).rejects.toThrow("--roles");
  });

  test("updates member successfully", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [{ id: "acct-123" }],
      put: async () => sampleMember(),
    });
    await membersUpdateRun([
      "--account-id", "acct-123",
      "--id", "member-1",
      "--roles", "role-uuid-123",
    ], ctx);
    expect(output.captured.successes[0]).toContain("updated");
  });
});

describe("accounts members remove", () => {
  test("requires --id", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(membersRemoveRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--id");
  });

  test("aborts without confirmation", async () => {
    const spy = spyOn(prompts, "confirm").mockResolvedValue(false);
    const { ctx, output } = createTestContext(
      { get: accountGet({}), delete: async () => ({}) },
      { yes: undefined },
    );
    await membersRemoveRun(["--account-id", "acct-123", "--id", "member-1"], ctx);
    expect(output.captured.warnings[0]).toContain("Aborted");
    spy.mockRestore();
  });

  test("removes member with confirmation", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet({}),
      delete: async () => ({}),
    });
    await membersRemoveRun(["--account-id", "acct-123", "--id", "member-1"], ctx);
    expect(output.captured.successes[0]).toContain("removed");
  });
});

// ─── Roles Router ──────────────────────────────────────────────────────────

describe("accounts roles router", () => {
  test("shows help", async () => {
    const { ctx, output } = createTestContext();
    await rolesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Roles ─────────────────────────────────────────────────────────────────

describe("accounts roles list", () => {
  test("returns table of roles", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet([sampleRole()]),
    });
    await rolesListRun(["--account-id", "acct-123"], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });
});

describe("accounts roles get", () => {
  test("requires --id", async () => {
    const { ctx } = createTestContext({ get: accountGet({}) });
    expect(rolesGetRun(["--account-id", "acct-123"], ctx)).rejects.toThrow("--id");
  });

  test("returns role details", async () => {
    const { ctx, output } = createTestContext({
      get: accountGet(sampleRole()),
    });
    await rolesGetRun(["--account-id", "acct-123", "--id", "role-uuid-123"], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("Administrator");
    expect(output.captured.details[0]!["Description"]).toBe("Full access to account resources");
  });
});
