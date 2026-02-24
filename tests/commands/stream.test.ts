import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Stream video commands
import { run as listRun } from "../../src/commands/stream/list.js";
import { run as getRun } from "../../src/commands/stream/get.js";
import { run as uploadRun } from "../../src/commands/stream/upload.js";
import { run as deleteRun } from "../../src/commands/stream/delete.js";
import { run as downloadRun } from "../../src/commands/stream/download.js";

// Stream live commands
import { run as liveListRun } from "../../src/commands/stream/live/list.js";
import { run as liveCreateRun } from "../../src/commands/stream/live/create.js";
import { run as liveGetRun } from "../../src/commands/stream/live/get.js";
import { run as liveUpdateRun } from "../../src/commands/stream/live/update.js";
import { run as liveDeleteRun } from "../../src/commands/stream/live/delete.js";
import { run as liveRouterRun } from "../../src/commands/stream/live/index.js";

// Stream captions commands
import { run as captionsListRun } from "../../src/commands/stream/captions/list.js";
import { run as captionsUploadRun } from "../../src/commands/stream/captions/upload.js";
import { run as captionsDeleteRun } from "../../src/commands/stream/captions/delete.js";
import { run as captionsRouterRun } from "../../src/commands/stream/captions/index.js";

// Stream audio commands
import { run as audioListRun } from "../../src/commands/stream/audio/list.js";
import { run as audioAddRun } from "../../src/commands/stream/audio/add.js";
import { run as audioDeleteRun } from "../../src/commands/stream/audio/delete.js";
import { run as audioRouterRun } from "../../src/commands/stream/audio/index.js";

// Stream signing-keys commands
import { run as skListRun } from "../../src/commands/stream/signing-keys/list.js";
import { run as skCreateRun } from "../../src/commands/stream/signing-keys/create.js";
import { run as skDeleteRun } from "../../src/commands/stream/signing-keys/delete.js";
import { run as skRouterRun } from "../../src/commands/stream/signing-keys/index.js";

// Stream watermarks commands
import { run as wmListRun } from "../../src/commands/stream/watermarks/list.js";
import { run as wmUploadRun } from "../../src/commands/stream/watermarks/upload.js";
import { run as wmDeleteRun } from "../../src/commands/stream/watermarks/delete.js";
import { run as wmRouterRun } from "../../src/commands/stream/watermarks/index.js";

// Stream webhooks commands
import { run as whGetRun } from "../../src/commands/stream/webhooks/get.js";
import { run as whSetRun } from "../../src/commands/stream/webhooks/set.js";
import { run as whDeleteRun } from "../../src/commands/stream/webhooks/delete.js";
import { run as whRouterRun } from "../../src/commands/stream/webhooks/index.js";

// Stream main router
import { run as streamRouterRun } from "../../src/commands/stream/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";

/** Helper: create a test context with auto-resolving account ID */
function streamCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

function sampleVideo(overrides: Record<string, unknown> = {}) {
  return {
    uid: "video-uid-123",
    status: { state: "ready" },
    duration: 120,
    size: 1048576,
    readyToStream: true,
    created: "2024-06-01T12:00:00.000Z",
    modified: "2024-06-01T13:00:00.000Z",
    preview: "https://example.com/preview",
    playback: { hls: "https://example.com/hls", dash: "https://example.com/dash" },
    requireSignedURLs: false,
    ...overrides,
  };
}

function sampleLiveInput(overrides: Record<string, unknown> = {}) {
  return {
    uid: "live-uid-123",
    meta: { name: "My Live Stream" },
    created: "2024-06-01T12:00:00.000Z",
    modified: "2024-06-01T13:00:00.000Z",
    rtmps: { url: "rtmps://live.example.com", streamKey: "sk_123" },
    srt: { url: "srt://live.example.com", streamId: "si_123", passphrase: "pass" },
    webRTC: { url: "https://webrtc.example.com" },
    status: { current: { state: "connected" } },
    recording: { mode: "automatic" },
    ...overrides,
  };
}

function sampleCaption(overrides: Record<string, unknown> = {}) {
  return { language: "en", label: "English", generated: false, ...overrides };
}

function sampleAudioTrack(overrides: Record<string, unknown> = {}) {
  return { uid: "audio-uid-123", label: "English", language: "en", default: true, status: "ready", ...overrides };
}

function sampleSigningKey(overrides: Record<string, unknown> = {}) {
  return { id: "key-123", pem: "pem-data", jwk: "jwk-data", created: "2024-06-01T12:00:00.000Z", ...overrides };
}

function sampleWatermark(overrides: Record<string, unknown> = {}) {
  return { uid: "wm-uid-123", name: "logo", size: 2048, position: "center", created: "2024-06-01T12:00:00.000Z", ...overrides };
}

function sampleWebhook(overrides: Record<string, unknown> = {}) {
  return { notificationUrl: "https://hooks.example.com/stream", modified: "2024-06-01T12:00:00.000Z", ...overrides };
}

// ─── Stream Videos ──────────────────────────────────────────────────────

describe("stream list", () => {
  test("lists videos", async () => {
    const videos = [sampleVideo(), sampleVideo({ uid: "video-uid-456" })];
    const { ctx, output } = streamCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return videos;
      },
    });
    await listRun(["--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("passes start and end params", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = streamCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedParams = params;
        return [];
      },
    });
    await listRun(["--account-id", ACCOUNT_ID, "--start", "2024-01-01", "--end", "2024-06-01"], ctx);
    expect(capturedParams?.start).toBe("2024-01-01");
    expect(capturedParams?.end).toBe("2024-06-01");
  });
});

describe("stream get", () => {
  test("gets video details", async () => {
    const video = sampleVideo();
    const { ctx, output } = streamCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return video;
      },
    });
    await getRun(["--id", "video-uid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe("video-uid-123");
  });

  test("throws when --id missing", async () => {
    const { ctx } = streamCtx();
    expect(getRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("stream upload", () => {
  test("throws when neither --file nor --url provided", async () => {
    const { ctx } = streamCtx();
    expect(uploadRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when both --file and --url provided", async () => {
    const { ctx } = streamCtx();
    expect(uploadRun(["--account-id", ACCOUNT_ID, "--file", "test.mp4", "--url", "https://example.com"], ctx)).rejects.toThrow("not both");
  });

  test("uploads from URL via copy endpoint", async () => {
    let capturedPath = "";
    let capturedBody: unknown;
    const { ctx, output } = streamCtx({
      post: async (path: string, body: unknown) => {
        capturedPath = path;
        capturedBody = body;
        return { uid: "new-video-uid" };
      },
    });
    await uploadRun(["--account-id", ACCOUNT_ID, "--url", "https://example.com/video.mp4", "--name", "test"], ctx);
    expect(capturedPath).toContain("/stream/copy");
    expect((capturedBody as Record<string, unknown>).url).toBe("https://example.com/video.mp4");
    expect(output.captured.successes[0]).toContain("new-video-uid");
  });
});

describe("stream delete", () => {
  test("deletes video with confirmation", async () => {
    let deletedPath = "";
    const { ctx, output } = streamCtx({
      delete: async (path: string) => {
        deletedPath = path;
        return {};
      },
    });
    await deleteRun(["--id", "video-uid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(deletedPath).toContain("video-uid-123");
    expect(output.captured.successes[0]).toContain("video-uid-123");
  });

  test("aborts when not confirmed", async () => {
    const { ctx, output } = streamCtx({}, { yes: false });
    await deleteRun(["--id", "video-uid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id missing", async () => {
    const { ctx } = streamCtx();
    expect(deleteRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("stream download", () => {
  test("gets download URL", async () => {
    const { ctx, output } = streamCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return { default: { url: "https://download.example.com/video.mp4", status: "ready", percentComplete: 100 } };
      },
    });
    await downloadRun(["--id", "video-uid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Download URL"]).toContain("download.example.com");
  });

  test("throws when --id missing", async () => {
    const { ctx } = streamCtx();
    expect(downloadRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

// ─── Stream Live Inputs ─────────────────────────────────────────────────

describe("stream live list", () => {
  test("lists live inputs", async () => {
    const inputs = [sampleLiveInput(), sampleLiveInput({ uid: "live-uid-456" })];
    const { ctx, output } = streamCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return inputs;
      },
    });
    await liveListRun(["--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("stream live create", () => {
  test("creates live input", async () => {
    let capturedBody: unknown;
    const { ctx, output } = streamCtx({
      post: async (_path: string, body: unknown) => {
        capturedBody = body;
        return sampleLiveInput();
      },
    });
    await liveCreateRun(["--name", "Test Stream", "--mode", "automatic", "--account-id", ACCOUNT_ID], ctx);
    expect((capturedBody as Record<string, unknown>).meta).toEqual({ name: "Test Stream" });
    expect(output.captured.successes[0]).toContain("live-uid-123");
  });

  test("throws when --name missing", async () => {
    const { ctx } = streamCtx();
    expect(liveCreateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--name");
  });
});

describe("stream live get", () => {
  test("gets live input details", async () => {
    const { ctx, output } = streamCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return sampleLiveInput();
      },
    });
    await liveGetRun(["--id", "live-uid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe("live-uid-123");
  });

  test("throws when --id missing", async () => {
    const { ctx } = streamCtx();
    expect(liveGetRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("stream live update", () => {
  test("updates live input", async () => {
    let capturedBody: unknown;
    const { ctx, output } = streamCtx({
      put: async (_path: string, body: unknown) => {
        capturedBody = body;
        return sampleLiveInput();
      },
    });
    await liveUpdateRun(["--id", "live-uid-123", "--name", "Updated", "--account-id", ACCOUNT_ID], ctx);
    expect((capturedBody as Record<string, unknown>).meta).toEqual({ name: "Updated" });
    expect(output.captured.successes[0]).toContain("live-uid-123");
  });

  test("throws when --id missing", async () => {
    const { ctx } = streamCtx();
    expect(liveUpdateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("stream live delete", () => {
  test("deletes live input", async () => {
    let deletedPath = "";
    const { ctx, output } = streamCtx({
      delete: async (path: string) => { deletedPath = path; return {}; },
    });
    await liveDeleteRun(["--id", "live-uid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(deletedPath).toContain("live-uid-123");
    expect(output.captured.successes[0]).toContain("live-uid-123");
  });

  test("aborts when not confirmed", async () => {
    const { ctx, output } = streamCtx({}, { yes: false });
    await liveDeleteRun(["--id", "live-uid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id missing", async () => {
    const { ctx } = streamCtx();
    expect(liveDeleteRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("stream live router", () => {
  test("shows help", async () => {
    const { ctx, output } = streamCtx();
    await liveRouterRun(["--help"], ctx);
    expect(output.captured.raws[0]).toContain("Usage:");
  });

  test("throws on unknown command", async () => {
    const { ctx } = streamCtx();
    expect(liveRouterRun(["bogus"], ctx)).rejects.toThrow("Unknown");
  });
});

// ─── Stream Captions ────────────────────────────────────────────────────

describe("stream captions list", () => {
  test("lists captions", async () => {
    const captions = [sampleCaption(), sampleCaption({ language: "es", label: "Spanish" })];
    const { ctx, output } = streamCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return captions;
      },
    });
    await captionsListRun(["--video", "video-uid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --video missing", async () => {
    const { ctx } = streamCtx();
    expect(captionsListRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--video");
  });
});

describe("stream captions upload", () => {
  test("throws when --video missing", async () => {
    const { ctx } = streamCtx();
    expect(captionsUploadRun(["--language", "en", "--file", "test.vtt", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--video");
  });

  test("throws when --language missing", async () => {
    const { ctx } = streamCtx();
    expect(captionsUploadRun(["--video", "v1", "--file", "test.vtt", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--language");
  });

  test("throws when --file missing", async () => {
    const { ctx } = streamCtx();
    expect(captionsUploadRun(["--video", "v1", "--language", "en", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("stream captions delete", () => {
  test("deletes captions", async () => {
    let deletedPath = "";
    const { ctx, output } = streamCtx({
      delete: async (path: string) => { deletedPath = path; return {}; },
    });
    await captionsDeleteRun(["--video", "video-uid-123", "--language", "en", "--account-id", ACCOUNT_ID], ctx);
    expect(deletedPath).toContain("video-uid-123");
    expect(deletedPath).toContain("en");
    expect(output.captured.successes[0]).toContain("en");
  });

  test("aborts when not confirmed", async () => {
    const { ctx, output } = streamCtx({}, { yes: false });
    await captionsDeleteRun(["--video", "v1", "--language", "en", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --video missing", async () => {
    const { ctx } = streamCtx();
    expect(captionsDeleteRun(["--language", "en", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--video");
  });

  test("throws when --language missing", async () => {
    const { ctx } = streamCtx();
    expect(captionsDeleteRun(["--video", "v1", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--language");
  });
});

describe("stream captions router", () => {
  test("shows help", async () => {
    const { ctx, output } = streamCtx();
    await captionsRouterRun(["--help"], ctx);
    expect(output.captured.raws[0]).toContain("Usage:");
  });

  test("throws on unknown command", async () => {
    const { ctx } = streamCtx();
    expect(captionsRouterRun(["bogus"], ctx)).rejects.toThrow("Unknown");
  });
});

// ─── Stream Audio ───────────────────────────────────────────────────────

describe("stream audio list", () => {
  test("lists audio tracks", async () => {
    const tracks = [sampleAudioTrack(), sampleAudioTrack({ uid: "audio-uid-456", label: "Spanish" })];
    const { ctx, output } = streamCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return tracks;
      },
    });
    await audioListRun(["--video", "video-uid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("throws when --video missing", async () => {
    const { ctx } = streamCtx();
    expect(audioListRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--video");
  });
});

describe("stream audio add", () => {
  test("adds audio track", async () => {
    let capturedBody: unknown;
    const { ctx, output } = streamCtx({
      post: async (_path: string, body: unknown) => {
        capturedBody = body;
        return sampleAudioTrack();
      },
    });
    await audioAddRun(["--video", "video-uid-123", "--label", "English", "--language", "en", "--account-id", ACCOUNT_ID], ctx);
    expect((capturedBody as Record<string, unknown>).label).toBe("English");
    expect(output.captured.successes[0]).toContain("audio-uid-123");
  });

  test("throws when --video missing", async () => {
    const { ctx } = streamCtx();
    expect(audioAddRun(["--label", "English", "--language", "en", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--video");
  });

  test("throws when --label missing", async () => {
    const { ctx } = streamCtx();
    expect(audioAddRun(["--video", "v1", "--language", "en", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--label");
  });

  test("throws when --language missing", async () => {
    const { ctx } = streamCtx();
    expect(audioAddRun(["--video", "v1", "--label", "English", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--language");
  });
});

describe("stream audio delete", () => {
  test("deletes audio track", async () => {
    let deletedPath = "";
    const { ctx, output } = streamCtx({
      delete: async (path: string) => { deletedPath = path; return {}; },
    });
    await audioDeleteRun(["--video", "video-uid-123", "--id", "audio-uid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(deletedPath).toContain("audio-uid-123");
    expect(output.captured.successes[0]).toContain("audio-uid-123");
  });

  test("aborts when not confirmed", async () => {
    const { ctx, output } = streamCtx({}, { yes: false });
    await audioDeleteRun(["--video", "v1", "--id", "audio-uid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --video missing", async () => {
    const { ctx } = streamCtx();
    expect(audioDeleteRun(["--id", "a1", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--video");
  });

  test("throws when --id missing", async () => {
    const { ctx } = streamCtx();
    expect(audioDeleteRun(["--video", "v1", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("stream audio router", () => {
  test("shows help", async () => {
    const { ctx, output } = streamCtx();
    await audioRouterRun(["--help"], ctx);
    expect(output.captured.raws[0]).toContain("Usage:");
  });

  test("throws on unknown command", async () => {
    const { ctx } = streamCtx();
    expect(audioRouterRun(["bogus"], ctx)).rejects.toThrow("Unknown");
  });
});

// ─── Stream Signing Keys ────────────────────────────────────────────────

describe("stream signing-keys list", () => {
  test("lists signing keys", async () => {
    const keys = [sampleSigningKey(), sampleSigningKey({ id: "key-456" })];
    const { ctx, output } = streamCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return keys;
      },
    });
    await skListRun(["--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("stream signing-keys create", () => {
  test("creates signing key", async () => {
    const { ctx, output } = streamCtx({
      post: async () => sampleSigningKey(),
    });
    await skCreateRun(["--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe("key-123");
    expect(output.captured.successes[0]).toContain("key-123");
  });
});

describe("stream signing-keys delete", () => {
  test("deletes signing key", async () => {
    let deletedPath = "";
    const { ctx, output } = streamCtx({
      delete: async (path: string) => { deletedPath = path; return {}; },
    });
    await skDeleteRun(["--id", "key-123", "--account-id", ACCOUNT_ID], ctx);
    expect(deletedPath).toContain("key-123");
    expect(output.captured.successes[0]).toContain("key-123");
  });

  test("aborts when not confirmed", async () => {
    const { ctx, output } = streamCtx({}, { yes: false });
    await skDeleteRun(["--id", "key-123", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id missing", async () => {
    const { ctx } = streamCtx();
    expect(skDeleteRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("stream signing-keys router", () => {
  test("shows help", async () => {
    const { ctx, output } = streamCtx();
    await skRouterRun(["--help"], ctx);
    expect(output.captured.raws[0]).toContain("Usage:");
  });

  test("throws on unknown command", async () => {
    const { ctx } = streamCtx();
    expect(skRouterRun(["bogus"], ctx)).rejects.toThrow("Unknown");
  });
});

// ─── Stream Watermarks ──────────────────────────────────────────────────

describe("stream watermarks list", () => {
  test("lists watermarks", async () => {
    const watermarks = [sampleWatermark(), sampleWatermark({ uid: "wm-uid-456" })];
    const { ctx, output } = streamCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return watermarks;
      },
    });
    await wmListRun(["--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("stream watermarks upload", () => {
  test("throws when --file missing", async () => {
    const { ctx } = streamCtx();
    expect(wmUploadRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("stream watermarks delete", () => {
  test("deletes watermark", async () => {
    let deletedPath = "";
    const { ctx, output } = streamCtx({
      delete: async (path: string) => { deletedPath = path; return {}; },
    });
    await wmDeleteRun(["--id", "wm-uid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(deletedPath).toContain("wm-uid-123");
    expect(output.captured.successes[0]).toContain("wm-uid-123");
  });

  test("aborts when not confirmed", async () => {
    const { ctx, output } = streamCtx({}, { yes: false });
    await wmDeleteRun(["--id", "wm-uid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id missing", async () => {
    const { ctx } = streamCtx();
    expect(wmDeleteRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("stream watermarks router", () => {
  test("shows help", async () => {
    const { ctx, output } = streamCtx();
    await wmRouterRun(["--help"], ctx);
    expect(output.captured.raws[0]).toContain("Usage:");
  });

  test("throws on unknown command", async () => {
    const { ctx } = streamCtx();
    expect(wmRouterRun(["bogus"], ctx)).rejects.toThrow("Unknown");
  });
});

// ─── Stream Webhooks ────────────────────────────────────────────────────

describe("stream webhooks get", () => {
  test("gets webhook config", async () => {
    const webhook = sampleWebhook();
    const { ctx, output } = streamCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return webhook;
      },
    });
    await whGetRun(["--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Notification URL"]).toContain("hooks.example.com");
  });
});

describe("stream webhooks set", () => {
  test("sets webhook URL", async () => {
    let capturedBody: unknown;
    const { ctx, output } = streamCtx({
      put: async (_path: string, body: unknown) => {
        capturedBody = body;
        return sampleWebhook();
      },
    });
    await whSetRun(["--url", "https://hooks.example.com/new", "--account-id", ACCOUNT_ID], ctx);
    expect((capturedBody as Record<string, unknown>).notificationUrl).toBe("https://hooks.example.com/new");
    expect(output.captured.successes[0]).toContain("Webhook set");
  });

  test("throws when --url missing", async () => {
    const { ctx } = streamCtx();
    expect(whSetRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--url");
  });
});

describe("stream webhooks delete", () => {
  test("deletes webhook", async () => {
    let deleteCalled = false;
    const { ctx, output } = streamCtx({
      delete: async () => { deleteCalled = true; return {}; },
    });
    await whDeleteRun(["--account-id", ACCOUNT_ID], ctx);
    expect(deleteCalled).toBe(true);
    expect(output.captured.successes[0]).toContain("deleted");
  });

  test("aborts when not confirmed", async () => {
    const { ctx, output } = streamCtx({}, { yes: false });
    await whDeleteRun(["--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos[0]).toContain("Aborted");
  });
});

describe("stream webhooks router", () => {
  test("shows help", async () => {
    const { ctx, output } = streamCtx();
    await whRouterRun(["--help"], ctx);
    expect(output.captured.raws[0]).toContain("Usage:");
  });

  test("throws on unknown command", async () => {
    const { ctx } = streamCtx();
    expect(whRouterRun(["bogus"], ctx)).rejects.toThrow("Unknown");
  });
});

// ─── Stream Main Router ─────────────────────────────────────────────────

describe("stream router", () => {
  test("shows help on --help", async () => {
    const { ctx, output } = streamCtx();
    await streamRouterRun(["--help"], ctx);
    expect(output.captured.raws[0]).toContain("Usage:");
  });

  test("shows help on no args", async () => {
    const { ctx, output } = streamCtx();
    await streamRouterRun([], ctx);
    expect(output.captured.raws[0]).toContain("Usage:");
  });

  test("throws on unknown command", async () => {
    const { ctx } = streamCtx();
    expect(streamRouterRun(["bogus"], ctx)).rejects.toThrow("Unknown");
  });

  test("routes list command", async () => {
    const { ctx, output } = streamCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await streamRouterRun(["list", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes live subcommand", async () => {
    const { ctx, output } = streamCtx();
    await streamRouterRun(["live", "--help"], ctx);
    expect(output.captured.raws[0]).toContain("live");
  });

  test("routes captions subcommand", async () => {
    const { ctx, output } = streamCtx();
    await streamRouterRun(["captions", "--help"], ctx);
    expect(output.captured.raws[0]).toContain("captions");
  });

  test("routes audio subcommand", async () => {
    const { ctx, output } = streamCtx();
    await streamRouterRun(["audio", "--help"], ctx);
    expect(output.captured.raws[0]).toContain("audio");
  });

  test("routes signing-keys subcommand", async () => {
    const { ctx, output } = streamCtx();
    await streamRouterRun(["signing-keys", "--help"], ctx);
    expect(output.captured.raws[0]).toContain("signing-keys");
  });

  test("routes watermarks subcommand", async () => {
    const { ctx, output } = streamCtx();
    await streamRouterRun(["watermarks", "--help"], ctx);
    expect(output.captured.raws[0]).toContain("watermarks");
  });

  test("routes webhooks subcommand", async () => {
    const { ctx, output } = streamCtx();
    await streamRouterRun(["webhooks", "--help"], ctx);
    expect(output.captured.raws[0]).toContain("webhooks");
  });
});
