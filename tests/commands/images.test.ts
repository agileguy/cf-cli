import { describe, test, expect } from "bun:test";
import { createTestContext } from "../helpers.js";

// Images core commands
import { run as listRun } from "../../src/commands/images/list.js";
import { run as getRun } from "../../src/commands/images/get.js";
import { run as uploadRun } from "../../src/commands/images/upload.js";
import { run as updateRun } from "../../src/commands/images/update.js";
import { run as deleteRun } from "../../src/commands/images/delete.js";
import { run as statsRun } from "../../src/commands/images/stats.js";
import { run as directUploadRun } from "../../src/commands/images/direct-upload.js";

// Images variants commands
import { run as variantsListRun } from "../../src/commands/images/variants/list.js";
import { run as variantsGetRun } from "../../src/commands/images/variants/get.js";
import { run as variantsCreateRun } from "../../src/commands/images/variants/create.js";
import { run as variantsUpdateRun } from "../../src/commands/images/variants/update.js";
import { run as variantsDeleteRun } from "../../src/commands/images/variants/delete.js";
import { run as variantsRouterRun } from "../../src/commands/images/variants/index.js";

// Images signing-keys commands
import { run as skListRun } from "../../src/commands/images/signing-keys/list.js";
import { run as skCreateRun } from "../../src/commands/images/signing-keys/create.js";
import { run as skRouterRun } from "../../src/commands/images/signing-keys/index.js";

// Images main router
import { run as imagesRouterRun } from "../../src/commands/images/index.js";

const ACCOUNT_ID = "abc123def456abc123def456abc12345";

/** Helper: create a test context with auto-resolving account ID */
function imgCtx(clientOverrides: Record<string, unknown> = {}, flagOverrides: Record<string, unknown> = {}) {
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

function sampleImage(overrides: Record<string, unknown> = {}) {
  return {
    id: "img-uuid-123",
    filename: "photo.jpg",
    uploaded: "2024-06-01T12:00:00.000Z",
    requireSignedURLs: false,
    variants: ["public", "thumbnail"],
    meta: { name: "My Photo" },
    ...overrides,
  };
}

function sampleVariant(overrides: Record<string, unknown> = {}) {
  return {
    id: "thumbnail",
    options: { fit: "scale-down", width: 200, height: 200, metadata: "none" },
    neverRequireSignedURLs: false,
    ...overrides,
  };
}

function sampleSigningKey(overrides: Record<string, unknown> = {}) {
  return { name: "default-signing-key", value: "sk_value_abc123", ...overrides };
}

function sampleStats(overrides: Record<string, unknown> = {}) {
  return { count: { current: 150, allowed: 100000 }, ...overrides };
}

function sampleDirectUpload(overrides: Record<string, unknown> = {}) {
  return { id: "img-uuid-new", uploadURL: "https://upload.example.com/direct/abc123", ...overrides };
}

// ─── Images Core ────────────────────────────────────────────────────────

describe("images list", () => {
  test("lists images", async () => {
    const images = [sampleImage(), sampleImage({ id: "img-uuid-456" })];
    const { ctx, output } = imgCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return images;
      },
    });
    await listRun(["--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });

  test("passes pagination params", async () => {
    let capturedParams: Record<string, string> | undefined;
    const { ctx } = imgCtx({
      get: async (path: string, params?: Record<string, string>) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        capturedParams = params;
        return [];
      },
    });
    await listRun(["--account-id", ACCOUNT_ID, "--page", "2", "--per-page", "50"], ctx);
    expect(capturedParams?.page).toBe("2");
    expect(capturedParams?.per_page).toBe("50");
  });
});

describe("images get", () => {
  test("gets image details", async () => {
    const image = sampleImage();
    const { ctx, output } = imgCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return image;
      },
    });
    await getRun(["--id", "img-uuid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe("img-uuid-123");
    expect(output.captured.details[0]!["Filename"]).toBe("photo.jpg");
  });

  test("throws when --id missing", async () => {
    const { ctx } = imgCtx();
    expect(getRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("images upload", () => {
  test("throws when neither --file nor --url provided", async () => {
    const { ctx } = imgCtx();
    expect(uploadRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });

  test("throws when both --file and --url provided", async () => {
    const { ctx } = imgCtx();
    expect(uploadRun(["--account-id", ACCOUNT_ID, "--file", "test.jpg", "--url", "https://example.com/img.jpg"], ctx)).rejects.toThrow("not both");
  });

  test("uploads from URL", async () => {
    let capturedFormData: FormData | undefined;
    const { ctx, output } = imgCtx({
      upload: async (_path: string, formData: FormData) => {
        capturedFormData = formData;
        return sampleImage();
      },
    });
    await uploadRun(["--account-id", ACCOUNT_ID, "--url", "https://example.com/img.jpg", "--name", "test"], ctx);
    expect(capturedFormData?.get("url")).toBe("https://example.com/img.jpg");
    expect(output.captured.successes[0]).toContain("img-uuid-123");
  });
});

describe("images update", () => {
  test("updates image metadata with --name", async () => {
    let capturedBody: unknown;
    const { ctx, output } = imgCtx({
      patch: async (_path: string, body: unknown) => {
        capturedBody = body;
        return sampleImage();
      },
    });
    await updateRun(["--id", "img-uuid-123", "--name", "Updated Name", "--account-id", ACCOUNT_ID], ctx);
    expect((capturedBody as Record<string, unknown>).metadata).toEqual({ name: "Updated Name" });
    expect(output.captured.successes[0]).toContain("img-uuid-123");
  });

  test("updates image metadata with --metadata JSON", async () => {
    let capturedBody: unknown;
    const { ctx, output } = imgCtx({
      patch: async (_path: string, body: unknown) => {
        capturedBody = body;
        return sampleImage();
      },
    });
    await updateRun(["--id", "img-uuid-123", "--metadata", '{"key":"value"}', "--account-id", ACCOUNT_ID], ctx);
    expect((capturedBody as Record<string, unknown>).metadata).toEqual({ key: "value" });
    expect(output.captured.successes[0]).toContain("img-uuid-123");
  });

  test("throws on invalid --metadata JSON", async () => {
    const { ctx } = imgCtx();
    expect(updateRun(["--id", "img-uuid-123", "--metadata", "not-json", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("valid JSON");
  });

  test("throws when --id missing", async () => {
    const { ctx } = imgCtx();
    expect(updateRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("images delete", () => {
  test("deletes image with confirmation", async () => {
    let deletedPath = "";
    const { ctx, output } = imgCtx({
      delete: async (path: string) => { deletedPath = path; return {}; },
    });
    await deleteRun(["--id", "img-uuid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(deletedPath).toContain("img-uuid-123");
    expect(output.captured.successes[0]).toContain("img-uuid-123");
  });

  test("aborts when not confirmed", async () => {
    const { ctx, output } = imgCtx({}, { yes: false });
    await deleteRun(["--id", "img-uuid-123", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id missing", async () => {
    const { ctx } = imgCtx();
    expect(deleteRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("images stats", () => {
  test("shows stats", async () => {
    const stats = sampleStats();
    const { ctx, output } = imgCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return stats;
      },
    });
    await statsRun(["--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Current Count"]).toBe(150);
    expect(output.captured.details[0]!["Allowed Count"]).toBe(100000);
  });
});

describe("images direct-upload", () => {
  test("creates direct upload URL", async () => {
    const { ctx, output } = imgCtx({
      post: async () => sampleDirectUpload(),
    });
    await directUploadRun(["--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Upload URL"]).toContain("upload.example.com");
  });

  test("passes expiry param", async () => {
    let capturedBody: unknown;
    const { ctx } = imgCtx({
      post: async (_path: string, body: unknown) => {
        capturedBody = body;
        return sampleDirectUpload();
      },
    });
    await directUploadRun(["--account-id", ACCOUNT_ID, "--expiry", "2025-01-01T00:00:00Z"], ctx);
    expect((capturedBody as Record<string, unknown>).expiry).toBe("2025-01-01T00:00:00Z");
  });
});

// ─── Images Variants ────────────────────────────────────────────────────

describe("images variants list", () => {
  test("lists variants from object", async () => {
    const variantsObj = {
      thumbnail: { id: "thumbnail", options: { fit: "scale-down", width: 200, height: 200 } },
      public: { id: "public", options: { fit: "contain", width: 1920, height: 1080 } },
    };
    const { ctx, output } = imgCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return variantsObj;
      },
    });
    await variantsListRun(["--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
    expect(output.captured.tables[0]!.data).toHaveLength(2);
  });
});

describe("images variants get", () => {
  test("gets variant details", async () => {
    const variant = sampleVariant();
    const { ctx, output } = imgCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return variant;
      },
    });
    await variantsGetRun(["--id", "thumbnail", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["ID"]).toBe("thumbnail");
    expect(output.captured.details[0]!["Fit"]).toBe("scale-down");
  });

  test("throws when --id missing", async () => {
    const { ctx } = imgCtx();
    expect(variantsGetRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("images variants create", () => {
  test("throws when --id missing", async () => {
    const { ctx } = imgCtx();
    expect(variantsCreateRun(["--file", "variant.json", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file missing", async () => {
    const { ctx } = imgCtx();
    expect(variantsCreateRun(["--id", "thumbnail", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("images variants update", () => {
  test("throws when --id missing", async () => {
    const { ctx } = imgCtx();
    expect(variantsUpdateRun(["--file", "variant.json", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });

  test("throws when --file missing", async () => {
    const { ctx } = imgCtx();
    expect(variantsUpdateRun(["--id", "thumbnail", "--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--file");
  });
});

describe("images variants delete", () => {
  test("deletes variant", async () => {
    let deletedPath = "";
    const { ctx, output } = imgCtx({
      delete: async (path: string) => { deletedPath = path; return {}; },
    });
    await variantsDeleteRun(["--id", "thumbnail", "--account-id", ACCOUNT_ID], ctx);
    expect(deletedPath).toContain("thumbnail");
    expect(output.captured.successes[0]).toContain("thumbnail");
  });

  test("aborts when not confirmed", async () => {
    const { ctx, output } = imgCtx({}, { yes: false });
    await variantsDeleteRun(["--id", "thumbnail", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.infos[0]).toContain("Aborted");
  });

  test("throws when --id missing", async () => {
    const { ctx } = imgCtx();
    expect(variantsDeleteRun(["--account-id", ACCOUNT_ID], ctx)).rejects.toThrow("--id");
  });
});

describe("images variants router", () => {
  test("shows help", async () => {
    const { ctx, output } = imgCtx();
    await variantsRouterRun(["--help"], ctx);
    expect(output.captured.raws[0]).toContain("Usage:");
  });

  test("throws on unknown command", async () => {
    const { ctx } = imgCtx();
    expect(variantsRouterRun(["bogus"], ctx)).rejects.toThrow("Unknown");
  });
});

// ─── Images Signing Keys ────────────────────────────────────────────────

describe("images signing-keys list", () => {
  test("lists signing keys", async () => {
    const keys = [sampleSigningKey(), sampleSigningKey({ name: "other-key" })];
    const { ctx, output } = imgCtx({
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

describe("images signing-keys create", () => {
  test("creates signing key", async () => {
    const { ctx, output } = imgCtx({
      post: async () => sampleSigningKey(),
    });
    await skCreateRun(["--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.details).toHaveLength(1);
    expect(output.captured.details[0]!["Name"]).toBe("default-signing-key");
    expect(output.captured.successes[0]).toContain("default-signing-key");
  });
});

describe("images signing-keys router", () => {
  test("shows help", async () => {
    const { ctx, output } = imgCtx();
    await skRouterRun(["--help"], ctx);
    expect(output.captured.raws[0]).toContain("Usage:");
  });

  test("throws on unknown command", async () => {
    const { ctx } = imgCtx();
    expect(skRouterRun(["bogus"], ctx)).rejects.toThrow("Unknown");
  });
});

// ─── Images Main Router ─────────────────────────────────────────────────

describe("images router", () => {
  test("shows help on --help", async () => {
    const { ctx, output } = imgCtx();
    await imagesRouterRun(["--help"], ctx);
    expect(output.captured.raws[0]).toContain("Usage:");
  });

  test("shows help on no args", async () => {
    const { ctx, output } = imgCtx();
    await imagesRouterRun([], ctx);
    expect(output.captured.raws[0]).toContain("Usage:");
  });

  test("throws on unknown command", async () => {
    const { ctx } = imgCtx();
    expect(imagesRouterRun(["bogus"], ctx)).rejects.toThrow("Unknown");
  });

  test("routes list command", async () => {
    const { ctx, output } = imgCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return [];
      },
    });
    await imagesRouterRun(["list", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.tables).toHaveLength(1);
  });

  test("routes stats command", async () => {
    const { ctx, output } = imgCtx({
      get: async (path: string) => {
        if (path === "/accounts") return [{ id: ACCOUNT_ID }];
        return sampleStats();
      },
    });
    await imagesRouterRun(["stats", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.details).toHaveLength(1);
  });

  test("routes variants subcommand", async () => {
    const { ctx, output } = imgCtx();
    await imagesRouterRun(["variants", "--help"], ctx);
    expect(output.captured.raws[0]).toContain("variants");
  });

  test("routes signing-keys subcommand", async () => {
    const { ctx, output } = imgCtx();
    await imagesRouterRun(["signing-keys", "--help"], ctx);
    expect(output.captured.raws[0]).toContain("signing-keys");
  });

  test("routes direct-upload command", async () => {
    const { ctx, output } = imgCtx({
      post: async () => sampleDirectUpload(),
    });
    await imagesRouterRun(["direct-upload", "--account-id", ACCOUNT_ID], ctx);
    expect(output.captured.details).toHaveLength(1);
  });
});
