import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Rulesets top-level
import { run as listRun } from "../../src/commands/rulesets/list.js";
import { run as getRun } from "../../src/commands/rulesets/get.js";
import { run as createRun } from "../../src/commands/rulesets/create.js";
import { run as updateRun } from "../../src/commands/rulesets/update.js";
import { run as deleteRun } from "../../src/commands/rulesets/delete.js";
import { run as routerRun } from "../../src/commands/rulesets/index.js";

// Rulesets rules
import { run as rulesListRun } from "../../src/commands/rulesets/rules/list.js";
import { run as rulesCreateRun } from "../../src/commands/rulesets/rules/create.js";
import { run as rulesUpdateRun } from "../../src/commands/rulesets/rules/update.js";
import { run as rulesDeleteRun } from "../../src/commands/rulesets/rules/delete.js";
import { run as rulesRouterRun } from "../../src/commands/rulesets/rules/index.js";

// Rulesets versions
import { run as versionsListRun } from "../../src/commands/rulesets/versions/list.js";
import { run as versionsGetRun } from "../../src/commands/rulesets/versions/get.js";
import { run as versionsRouterRun } from "../../src/commands/rulesets/versions/index.js";

// Rulesets phases
import { run as phasesListRun } from "../../src/commands/rulesets/phases/list.js";
import { run as phasesGetRun } from "../../src/commands/rulesets/phases/get.js";
import { run as phasesRouterRun } from "../../src/commands/rulesets/phases/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";
const RULESET_ID = "rs-uuid-123";
const RULE_ID = "rule-uuid-456";

function sampleRuleset(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: RULESET_ID,
    name: "My Ruleset",
    description: "Test ruleset",
    kind: "zone",
    phase: "http_request_firewall_custom",
    version: "3",
    last_updated: "2024-06-01T12:00:00.000Z",
    rules: [
      {
        id: RULE_ID,
        action: "block",
        expression: "(ip.src eq 1.2.3.4)",
        description: "Block bad IP",
        enabled: true,
      },
    ],
    ...overrides,
  };
}

// ─── Rulesets list ─────────────────────────────────────────────────────

describe("rulesets list", () => {
  test("lists rulesets for a zone", async () => {
    const rulesets = [sampleRuleset(), sampleRuleset({ id: "rs-2", name: "Second" })];
    const { ctx, output } = createTestContext({
      get: async () => rulesets,
    });

    await listRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("lists rulesets for an account", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [sampleRuleset()],
    });

    await listRun(["--account-id", "acc-123"], ctx);

    expect(output.captured.tables).toHaveLength(1);
  });

  test("throws when neither --zone nor --account-id", async () => {
    const { ctx } = createTestContext();
    expect(listRun([], ctx)).rejects.toThrow("--zone");
  });

  test("throws when both --zone and --account-id", async () => {
    const { ctx } = createTestContext();
    expect(listRun(["--zone", ZONE_ID, "--account-id", "acc-123"], ctx)).rejects.toThrow("not both");
  });
});

// ─── Rulesets get ──────────────────────────────────────────────────────

describe("rulesets get", () => {
  test("gets a ruleset", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleRuleset(),
    });

    await getRun(["--zone", ZONE_ID, "--id", RULESET_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("My Ruleset");
  });

  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(getRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });

  test("outputs rules as JSON when present", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleRuleset(),
    });

    await getRun(["--zone", ZONE_ID, "--id", RULESET_ID], ctx);

    expect(output.captured.jsons).toHaveLength(1);
  });
});

// ─── Rulesets delete ───────────────────────────────────────────────────

describe("rulesets delete", () => {
  test("deletes a ruleset with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return undefined;
      },
    });

    await deleteRun(["--zone", ZONE_ID, "--id", RULESET_ID], ctx);

    expect(deletedPath).toContain(RULESET_ID);
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await deleteRun(["--zone", ZONE_ID, "--id", RULESET_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

// ─── Rulesets create ───────────────────────────────────────────────────

describe("rulesets create", () => {
  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(createRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--file");
  });
});

// ─── Rulesets update ───────────────────────────────────────────────────

describe("rulesets update", () => {
  test("throws when --id missing", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--zone", ZONE_ID, "--file", "x.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(updateRun(["--zone", ZONE_ID, "--id", RULESET_ID], ctx)).rejects.toThrow("--file");
  });
});

// ─── Rules list ────────────────────────────────────────────────────────

describe("rulesets rules list", () => {
  test("lists rules in a ruleset", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleRuleset(),
    });

    await rulesListRun(["--zone", ZONE_ID, "--ruleset", RULESET_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });

  test("throws when --ruleset missing", async () => {
    const { ctx } = createTestContext();
    expect(rulesListRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--ruleset");
  });
});

// ─── Rules create ──────────────────────────────────────────────────────

describe("rulesets rules create", () => {
  test("throws when --file missing", async () => {
    const { ctx } = createTestContext();
    expect(rulesCreateRun(["--zone", ZONE_ID, "--ruleset", RULESET_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when --ruleset missing", async () => {
    const { ctx } = createTestContext();
    expect(rulesCreateRun(["--zone", ZONE_ID, "--file", "x.json"], ctx)).rejects.toThrow("--ruleset");
  });
});

// ─── Rules update ──────────────────────────────────────────────────────

describe("rulesets rules update", () => {
  test("throws when --rule missing", async () => {
    const { ctx } = createTestContext();
    expect(rulesUpdateRun(["--zone", ZONE_ID, "--ruleset", RULESET_ID, "--file", "x.json"], ctx)).rejects.toThrow("--rule");
  });
});

// ─── Rules delete ──────────────────────────────────────────────────────

describe("rulesets rules delete", () => {
  test("deletes a rule with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = createTestContext({
      delete: async (path: string) => {
        deletedPath = path;
        return undefined;
      },
    });

    await rulesDeleteRun(["--zone", ZONE_ID, "--ruleset", RULESET_ID, "--rule", RULE_ID], ctx);

    expect(deletedPath).toContain(RULE_ID);
    expect(output.captured.successes).toHaveLength(1);
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = createTestContext({}, { yes: undefined });

    await rulesDeleteRun(["--zone", ZONE_ID, "--ruleset", RULESET_ID, "--rule", RULE_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

// ─── Versions list ─────────────────────────────────────────────────────

describe("rulesets versions list", () => {
  test("lists versions of a ruleset", async () => {
    const versions = [sampleRuleset({ version: "1" }), sampleRuleset({ version: "2" })];
    const { ctx, output } = createTestContext({
      get: async () => versions,
    });

    await versionsListRun(["--zone", ZONE_ID, "--ruleset", RULESET_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --ruleset missing", async () => {
    const { ctx } = createTestContext();
    expect(versionsListRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--ruleset");
  });
});

// ─── Versions get ──────────────────────────────────────────────────────

describe("rulesets versions get", () => {
  test("gets a specific version", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleRuleset({ version: "2" }),
    });

    await versionsGetRun(["--zone", ZONE_ID, "--ruleset", RULESET_ID, "--version", "2"], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Version"]).toBe("2");
  });

  test("throws when --version missing", async () => {
    const { ctx } = createTestContext();
    expect(versionsGetRun(["--zone", ZONE_ID, "--ruleset", RULESET_ID], ctx)).rejects.toThrow("--version");
  });
});

// ─── Phases list ───────────────────────────────────────────────────────

describe("rulesets phases list", () => {
  test("lists phases (rulesets with phase)", async () => {
    const rulesets = [
      sampleRuleset({ phase: "http_request_firewall_custom" }),
      sampleRuleset({ id: "rs-no-phase", phase: undefined }),
    ];
    const { ctx, output } = createTestContext({
      get: async () => rulesets,
    });

    await phasesListRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    // Only the one with a phase should show
    expect(output.captured.tables[0]!.data).toHaveLength(1);
  });
});

// ─── Phases get ────────────────────────────────────────────────────────

describe("rulesets phases get", () => {
  test("gets a phase entrypoint", async () => {
    let capturedPath = "";
    const { ctx, output } = createTestContext({
      get: async (path: string) => {
        capturedPath = path;
        return sampleRuleset();
      },
    });

    await phasesGetRun(["--zone", ZONE_ID, "--phase", "http_request_firewall_custom"], ctx);

    expect(capturedPath).toContain("phases/http_request_firewall_custom/entrypoint");
    expect(output.captured.details).toHaveLength(1);
  });

  test("throws when --phase missing", async () => {
    const { ctx } = createTestContext();
    expect(phasesGetRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--phase");
  });
});

// ─── Router tests ──────────────────────────────────────────────────────

describe("rulesets router", () => {
  test("routes to list", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["list", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes to rules sub-router", async () => {
    const { ctx, output } = createTestContext({
      get: async () => sampleRuleset(),
    });
    await routerRun(["rules", "list", "--zone", ZONE_ID, "--ruleset", RULESET_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes to versions sub-router", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["versions", "list", "--zone", ZONE_ID, "--ruleset", RULESET_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes to phases sub-router", async () => {
    const { ctx, output } = createTestContext({
      get: async () => [],
    });
    await routerRun(["phases", "list", "--zone", ZONE_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await routerRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(routerRun(["unknown"], ctx)).rejects.toThrow("Unknown rulesets command");
  });
});

describe("rulesets rules router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await rulesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(rulesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown rulesets rules command");
  });
});

describe("rulesets versions router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await versionsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(versionsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown rulesets versions command");
  });
});

describe("rulesets phases router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await phasesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(phasesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown rulesets phases command");
  });
});
