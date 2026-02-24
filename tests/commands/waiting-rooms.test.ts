import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Core waiting rooms commands
import { run as listRun } from "../../src/commands/waiting-rooms/list.js";
import { run as getRun } from "../../src/commands/waiting-rooms/get.js";
import { run as createRun } from "../../src/commands/waiting-rooms/create.js";
import { run as updateRun } from "../../src/commands/waiting-rooms/update.js";
import { run as deleteRun } from "../../src/commands/waiting-rooms/delete.js";
import { run as statusRun } from "../../src/commands/waiting-rooms/status.js";

// Events commands
import { run as eventsListRun } from "../../src/commands/waiting-rooms/events/list.js";
import { run as eventsCreateRun } from "../../src/commands/waiting-rooms/events/create.js";
import { run as eventsUpdateRun } from "../../src/commands/waiting-rooms/events/update.js";
import { run as eventsDeleteRun } from "../../src/commands/waiting-rooms/events/delete.js";

// Rules commands
import { run as rulesListRun } from "../../src/commands/waiting-rooms/rules/list.js";
import { run as rulesUpsertRun } from "../../src/commands/waiting-rooms/rules/upsert.js";

// Routers
import { run as mainRouterRun } from "../../src/commands/waiting-rooms/index.js";
import { run as eventsRouterRun } from "../../src/commands/waiting-rooms/events/index.js";
import { run as rulesRouterRun } from "../../src/commands/waiting-rooms/rules/index.js";

const ZONE_ID = "023e105f4ecef8ad9ca31a8372d0c353";
const ROOM_ID = "wr-uuid-123";
const EVENT_ID = "evt-uuid-456";

function sampleWaitingRoom(overrides: Record<string, unknown> = {}) {
  return {
    id: ROOM_ID,
    name: "my-waiting-room",
    host: "shop.example.com",
    path: "/checkout",
    new_users_per_minute: 200,
    total_active_users: 500,
    session_duration: 10,
    queueing_method: "fifo",
    suspended: false,
    created_on: "2024-06-01T12:00:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

function sampleEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: EVENT_ID,
    name: "Flash Sale",
    event_start_time: "2024-12-01T00:00:00Z",
    event_end_time: "2024-12-02T00:00:00Z",
    suspended: false,
    ...overrides,
  };
}

function sampleRule(overrides: Record<string, unknown> = {}) {
  return {
    id: "rule-uuid-789",
    action: "bypass_waiting_room",
    expression: "ip.src eq 1.2.3.4",
    description: "Allow internal IPs",
    enabled: true,
    ...overrides,
  };
}

function wrCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

// ─── Waiting Rooms List ─────────────────────────────────────────────────

describe("waiting-rooms list", () => {
  test("lists waiting rooms", async () => {
    const rooms = [sampleWaitingRoom(), sampleWaitingRoom({ id: "wr-2", name: "other-room" })];
    const { ctx, output } = wrCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return rooms;
      },
    });

    await listRun(["--zone", ZONE_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = wrCtx();
    expect(listRun([], ctx)).rejects.toThrow("--zone");
  });
});

// ─── Waiting Rooms Get ──────────────────────────────────────────────────

describe("waiting-rooms get", () => {
  test("gets a waiting room by ID", async () => {
    const room = sampleWaitingRoom();
    const { ctx, output } = wrCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return room;
      },
    });

    await getRun(["--zone", ZONE_ID, "--id", ROOM_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("my-waiting-room");
    expect(output.captured.details[0]!["Host"]).toBe("shop.example.com");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = wrCtx();
    expect(getRun(["--id", ROOM_ID], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = wrCtx();
    expect(getRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Waiting Rooms Create ───────────────────────────────────────────────

describe("waiting-rooms create", () => {
  test("throws when --zone is missing", async () => {
    const { ctx } = wrCtx();
    expect(createRun(["--file", "test.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = wrCtx();
    expect(createRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = wrCtx();
    expect(createRun([
      "--zone", ZONE_ID,
      "--file", "/tmp/nonexistent-cf-cli-wr.json",
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Waiting Rooms Update ───────────────────────────────────────────────

describe("waiting-rooms update", () => {
  test("throws when --zone is missing", async () => {
    const { ctx } = wrCtx();
    expect(updateRun(["--id", ROOM_ID, "--file", "test.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = wrCtx();
    expect(updateRun(["--zone", ZONE_ID, "--file", "test.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = wrCtx();
    expect(updateRun(["--zone", ZONE_ID, "--id", ROOM_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = wrCtx();
    expect(updateRun([
      "--zone", ZONE_ID,
      "--id", ROOM_ID,
      "--file", "/tmp/nonexistent-cf-cli-wr-update.json",
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Waiting Rooms Delete ───────────────────────────────────────────────

describe("waiting-rooms delete", () => {
  test("deletes a waiting room with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = wrCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await deleteRun(["--zone", ZONE_ID, "--id", ROOM_ID], ctx);

    expect(deletedPath).toContain(ROOM_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = wrCtx({}, { yes: undefined });

    await deleteRun(["--zone", ZONE_ID, "--id", ROOM_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = wrCtx();
    expect(deleteRun(["--id", ROOM_ID], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = wrCtx();
    expect(deleteRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Waiting Rooms Status ───────────────────────────────────────────────

describe("waiting-rooms status", () => {
  test("gets waiting room status", async () => {
    const status = {
      status: "queueing",
      estimated_queued_users: 150,
      estimated_total_active_users: 500,
      max_estimated_time_minutes: 5,
    };
    const { ctx, output } = wrCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return status;
      },
    });

    await statusRun(["--zone", ZONE_ID, "--id", ROOM_ID], ctx);

    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Status"]).toBe("queueing");
    expect(output.captured.details[0]!["Queued Users"]).toBe(150);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = wrCtx();
    expect(statusRun(["--id", ROOM_ID], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = wrCtx();
    expect(statusRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Events List ────────────────────────────────────────────────────────

describe("waiting-rooms events list", () => {
  test("lists events for a waiting room", async () => {
    const events = [sampleEvent(), sampleEvent({ id: "evt-2", name: "Holiday Sale" })];
    const { ctx, output } = wrCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return events;
      },
    });

    await eventsListRun(["--zone", ZONE_ID, "--room", ROOM_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = wrCtx();
    expect(eventsListRun(["--room", ROOM_ID], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --room is missing", async () => {
    const { ctx } = wrCtx();
    expect(eventsListRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--room");
  });
});

// ─── Events Create ──────────────────────────────────────────────────────

describe("waiting-rooms events create", () => {
  test("throws when --zone is missing", async () => {
    const { ctx } = wrCtx();
    expect(eventsCreateRun(["--room", ROOM_ID, "--file", "test.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --room is missing", async () => {
    const { ctx } = wrCtx();
    expect(eventsCreateRun(["--zone", ZONE_ID, "--file", "test.json"], ctx)).rejects.toThrow("--room");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = wrCtx();
    expect(eventsCreateRun(["--zone", ZONE_ID, "--room", ROOM_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = wrCtx();
    expect(eventsCreateRun([
      "--zone", ZONE_ID,
      "--room", ROOM_ID,
      "--file", "/tmp/nonexistent-cf-cli-wr-event.json",
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Events Update ──────────────────────────────────────────────────────

describe("waiting-rooms events update", () => {
  test("throws when --zone is missing", async () => {
    const { ctx } = wrCtx();
    expect(eventsUpdateRun(["--room", ROOM_ID, "--id", EVENT_ID, "--file", "test.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --room is missing", async () => {
    const { ctx } = wrCtx();
    expect(eventsUpdateRun(["--zone", ZONE_ID, "--id", EVENT_ID, "--file", "test.json"], ctx)).rejects.toThrow("--room");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = wrCtx();
    expect(eventsUpdateRun(["--zone", ZONE_ID, "--room", ROOM_ID, "--file", "test.json"], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = wrCtx();
    expect(eventsUpdateRun(["--zone", ZONE_ID, "--room", ROOM_ID, "--id", EVENT_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = wrCtx();
    expect(eventsUpdateRun([
      "--zone", ZONE_ID,
      "--room", ROOM_ID,
      "--id", EVENT_ID,
      "--file", "/tmp/nonexistent-cf-cli-wr-evt-update.json",
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Events Delete ──────────────────────────────────────────────────────

describe("waiting-rooms events delete", () => {
  test("deletes an event with --yes", async () => {
    let deletedPath = "";
    const { ctx, output } = wrCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return {};
      },
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });

    await eventsDeleteRun(["--zone", ZONE_ID, "--room", ROOM_ID, "--id", EVENT_ID], ctx);

    expect(deletedPath).toContain(ROOM_ID);
    expect(deletedPath).toContain(EVENT_ID);
    expect(output.captured.successes).toHaveLength(1);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when confirmation denied", async () => {
    const { ctx, output } = wrCtx({}, { yes: undefined });

    await eventsDeleteRun(["--zone", ZONE_ID, "--room", ROOM_ID, "--id", EVENT_ID], ctx);

    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = wrCtx();
    expect(eventsDeleteRun(["--room", ROOM_ID, "--id", EVENT_ID], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --room is missing", async () => {
    const { ctx } = wrCtx();
    expect(eventsDeleteRun(["--zone", ZONE_ID, "--id", EVENT_ID], ctx)).rejects.toThrow("--room");
  });

  test("throws when --id is missing", async () => {
    const { ctx } = wrCtx();
    expect(eventsDeleteRun(["--zone", ZONE_ID, "--room", ROOM_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Rules List ─────────────────────────────────────────────────────────

describe("waiting-rooms rules list", () => {
  test("lists rules for a waiting room", async () => {
    const rules = [sampleRule(), sampleRule({ id: "rule-2", expression: "ip.src eq 5.6.7.8" })];
    const { ctx, output } = wrCtx({
      get: async (path: string) => {
        if (path === "/zones") return [{ id: ZONE_ID }];
        return rules;
      },
    });

    await rulesListRun(["--zone", ZONE_ID, "--room", ROOM_ID], ctx);

    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --zone is missing", async () => {
    const { ctx } = wrCtx();
    expect(rulesListRun(["--room", ROOM_ID], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --room is missing", async () => {
    const { ctx } = wrCtx();
    expect(rulesListRun(["--zone", ZONE_ID], ctx)).rejects.toThrow("--room");
  });
});

// ─── Rules Upsert ───────────────────────────────────────────────────────

describe("waiting-rooms rules upsert", () => {
  test("throws when --zone is missing", async () => {
    const { ctx } = wrCtx();
    expect(rulesUpsertRun(["--room", ROOM_ID, "--file", "test.json"], ctx)).rejects.toThrow("--zone");
  });

  test("throws when --room is missing", async () => {
    const { ctx } = wrCtx();
    expect(rulesUpsertRun(["--zone", ZONE_ID, "--file", "test.json"], ctx)).rejects.toThrow("--room");
  });

  test("throws when --file is missing", async () => {
    const { ctx } = wrCtx();
    expect(rulesUpsertRun(["--zone", ZONE_ID, "--room", ROOM_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when file does not exist", async () => {
    const { ctx } = wrCtx();
    expect(rulesUpsertRun([
      "--zone", ZONE_ID,
      "--room", ROOM_ID,
      "--file", "/tmp/nonexistent-cf-cli-wr-rules.json",
    ], ctx)).rejects.toThrow("Cannot read file");
  });
});

// ─── Routers ────────────────────────────────────────────────────────────

describe("waiting-rooms main router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(mainRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown waiting-rooms command");
  });

  test("routes 'events' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["events"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("routes 'rules' subcommand", async () => {
    const { ctx, output } = createTestContext();
    await mainRouterRun(["rules"], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });
});

describe("waiting-rooms events router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await eventsRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(eventsRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown waiting-rooms events command");
  });
});

describe("waiting-rooms rules router", () => {
  test("shows help with no args", async () => {
    const { ctx, output } = createTestContext();
    await rulesRouterRun([], ctx);
    expect(output.captured.raws.length).toBeGreaterThanOrEqual(1);
  });

  test("throws on unknown subcommand", async () => {
    const { ctx } = createTestContext();
    expect(rulesRouterRun(["unknown"], ctx)).rejects.toThrow("Unknown waiting-rooms rules command");
  });
});
