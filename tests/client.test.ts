import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { CloudflareHttpClient } from "../src/client.js";
import { CloudflareAPIError } from "../src/utils/errors.js";
import type { GlobalFlags, CloudflareResponse } from "../src/types/index.js";
import type { Credentials } from "../src/auth.js";

// Store original fetch
const originalFetch = globalThis.fetch;

function mockFetch(
  handler: (url: string, init?: RequestInit) => Promise<Response>,
): void {
  globalThis.fetch = handler as typeof fetch;
}

function makeResponse<T>(result: T, overrides?: Partial<CloudflareResponse<T>>): CloudflareResponse<T> {
  return {
    success: true,
    errors: [],
    messages: [],
    result,
    ...overrides,
  };
}

function jsonResponse<T>(body: CloudflareResponse<T>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("CloudflareHttpClient", () => {
  const tokenCreds: Credentials = { method: "token", token: "test-token-1234" };
  const keyCreds: Credentials = {
    method: "key",
    apiKey: "test-key-5678",
    email: "test@example.com",
  };
  const defaultFlags: GlobalFlags = {};

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("GET requests", () => {
    test("sends correct auth header for token auth", async () => {
      let capturedHeaders: HeadersInit | undefined;
      mockFetch(async (_url: string, init?: RequestInit) => {
        capturedHeaders = init?.headers;
        return jsonResponse(makeResponse({ id: "123" }));
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);
      await client.get("/zones");

      expect(capturedHeaders).toBeDefined();
      const headers = capturedHeaders as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer test-token-1234");
    });

    test("sends correct auth headers for API key auth", async () => {
      let capturedHeaders: HeadersInit | undefined;
      mockFetch(async (_url: string, init?: RequestInit) => {
        capturedHeaders = init?.headers;
        return jsonResponse(makeResponse({ id: "123" }));
      });

      const client = new CloudflareHttpClient(keyCreds, defaultFlags);
      await client.get("/zones");

      const headers = capturedHeaders as Record<string, string>;
      expect(headers["X-Auth-Key"]).toBe("test-key-5678");
      expect(headers["X-Auth-Email"]).toBe("test@example.com");
    });

    test("unwraps result from response envelope", async () => {
      mockFetch(async () => {
        return jsonResponse(makeResponse({ id: "zone-123", name: "example.com" }));
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);
      const result = await client.get<{ id: string; name: string }>("/zones/zone-123");

      expect(result.id).toBe("zone-123");
      expect(result.name).toBe("example.com");
    });

    test("appends query parameters", async () => {
      let capturedUrl = "";
      mockFetch(async (url: string) => {
        capturedUrl = url;
        return jsonResponse(makeResponse([]));
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);
      await client.get("/zones", { name: "example.com", page: "1" });

      expect(capturedUrl).toContain("name=example.com");
      expect(capturedUrl).toContain("page=1");
    });

    test("skips empty query params", async () => {
      let capturedUrl = "";
      mockFetch(async (url: string) => {
        capturedUrl = url;
        return jsonResponse(makeResponse([]));
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);
      await client.get("/zones", { name: "", status: "active" });

      expect(capturedUrl).not.toContain("name=");
      expect(capturedUrl).toContain("status=active");
    });
  });

  describe("POST requests", () => {
    test("sends JSON body", async () => {
      let capturedBody: string | undefined;
      let capturedHeaders: Record<string, string> | undefined;
      mockFetch(async (_url: string, init?: RequestInit) => {
        capturedBody = init?.body as string;
        capturedHeaders = init?.headers as Record<string, string>;
        return jsonResponse(makeResponse({ id: "new-zone" }));
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);
      await client.post("/zones", { name: "example.com" });

      expect(capturedHeaders?.["Content-Type"]).toBe("application/json");
      expect(JSON.parse(capturedBody ?? "")).toEqual({ name: "example.com" });
    });
  });

  describe("error handling", () => {
    test("throws CloudflareAPIError on non-2xx response", async () => {
      mockFetch(async () => {
        return jsonResponse(
          makeResponse(null, {
            success: false,
            errors: [{ code: 7003, message: "Zone not found" }],
          }),
          404,
        );
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);

      expect(client.get("/zones/missing")).rejects.toBeInstanceOf(CloudflareAPIError);
    });

    test("includes error codes in CloudflareAPIError", async () => {
      mockFetch(async () => {
        return jsonResponse(
          makeResponse(null, {
            success: false,
            errors: [{ code: 6003, message: "Invalid request headers" }],
          }),
          403,
        );
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);

      try {
        await client.get("/zones");
        expect(true).toBe(false); // Should not reach here
      } catch (err) {
        expect(err).toBeInstanceOf(CloudflareAPIError);
        const apiErr = err as CloudflareAPIError;
        expect(apiErr.statusCode).toBe(403);
        expect(apiErr.errorCode).toBe(6003);
        expect(apiErr.errors[0]?.message).toBe("Invalid request headers");
      }
    });

    test("provides suggestions for known error codes", async () => {
      const err = new CloudflareAPIError(403, 6003, [
        { code: 6003, message: "Invalid token" },
      ]);
      expect(err.getSuggestion()).toContain("Re-authenticate");
    });
  });

  describe("rate limiting and retry", () => {
    test("retries on 429 with exponential backoff", async () => {
      let callCount = 0;
      mockFetch(async () => {
        callCount++;
        if (callCount < 3) {
          return jsonResponse(
            makeResponse(null, {
              success: false,
              errors: [{ code: 0, message: "Rate limited" }],
            }),
            429,
          );
        }
        return jsonResponse(makeResponse({ id: "ok" }));
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);
      const result = await client.get<{ id: string }>("/zones");

      expect(result.id).toBe("ok");
      expect(callCount).toBe(3);
    }, 15000);

    test("fails after max retries on persistent 429", async () => {
      let callCount = 0;
      mockFetch(async () => {
        callCount++;
        return jsonResponse(
          makeResponse(null, {
            success: false,
            errors: [{ code: 0, message: "Rate limited" }],
          }),
          429,
        );
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);

      try {
        await client.get("/zones");
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(CloudflareAPIError);
        expect((err as CloudflareAPIError).statusCode).toBe(429);
      }

      // Should have tried MAX_RETRIES + 1 times
      expect(callCount).toBe(4);
    }, 20000);
  });

  describe("auto-pagination", () => {
    test("fetches all pages with page-based pagination", async () => {
      let requestCount = 0;
      mockFetch(async (url: string) => {
        requestCount++;
        const urlObj = new URL(url);
        const page = parseInt(urlObj.searchParams.get("page") ?? "1");

        if (page === 1) {
          return jsonResponse({
            success: true,
            errors: [],
            messages: [],
            result: [{ id: "a" }, { id: "b" }],
            result_info: {
              page: 1,
              per_page: 2,
              total_pages: 3,
              count: 2,
              total_count: 5,
            },
          });
        }
        if (page === 2) {
          return jsonResponse({
            success: true,
            errors: [],
            messages: [],
            result: [{ id: "c" }, { id: "d" }],
            result_info: {
              page: 2,
              per_page: 2,
              total_pages: 3,
              count: 2,
              total_count: 5,
            },
          });
        }
        return jsonResponse({
          success: true,
          errors: [],
          messages: [],
          result: [{ id: "e" }],
          result_info: {
            page: 3,
            per_page: 2,
            total_pages: 3,
            count: 1,
            total_count: 5,
          },
        });
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);
      const results = await client.fetchAll<{ id: string }>("/zones");

      expect(results).toHaveLength(5);
      expect(results.map((r) => r.id)).toEqual(["a", "b", "c", "d", "e"]);
      expect(requestCount).toBe(3);
    });

    test("fetches all pages with cursor-based pagination", async () => {
      let requestCount = 0;
      mockFetch(async (url: string) => {
        requestCount++;
        const urlObj = new URL(url);
        const cursor = urlObj.searchParams.get("cursor");

        if (!cursor) {
          return jsonResponse({
            success: true,
            errors: [],
            messages: [],
            result: [{ id: "a" }],
            result_info: {
              page: 1,
              per_page: 1,
              total_pages: 1,
              count: 1,
              total_count: 2,
              cursors: { after: "cursor-page-2" },
            },
          });
        }
        return jsonResponse({
          success: true,
          errors: [],
          messages: [],
          result: [{ id: "b" }],
          result_info: {
            page: 1,
            per_page: 1,
            total_pages: 1,
            count: 1,
            total_count: 2,
          },
        });
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);
      const results = await client.fetchAll<{ id: string }>("/logs");

      expect(results).toHaveLength(2);
      expect(requestCount).toBe(2);
    });

    test("handles empty result set", async () => {
      mockFetch(async () => {
        return jsonResponse({
          success: true,
          errors: [],
          messages: [],
          result: [],
          result_info: {
            page: 1,
            per_page: 50,
            total_pages: 0,
            count: 0,
            total_count: 0,
          },
        });
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);
      const results = await client.fetchAll<{ id: string }>("/zones");

      expect(results).toHaveLength(0);
    });
  });

  describe("verbose logging", () => {
    test("logs request details when --verbose is set", async () => {
      const stderrWrites: string[] = [];
      const originalWrite = process.stderr.write;
      process.stderr.write = ((chunk: unknown) => {
        stderrWrites.push(String(chunk));
        return true;
      }) as typeof process.stderr.write;

      mockFetch(async () => {
        return jsonResponse(makeResponse({ id: "123" }));
      });

      const client = new CloudflareHttpClient(tokenCreds, { verbose: true });
      await client.get("/zones");

      process.stderr.write = originalWrite;

      const logOutput = stderrWrites.join("");
      expect(logOutput).toContain("GET");
      expect(logOutput).toContain("/zones");
      // Should redact token
      expect(logOutput).not.toContain("test-token-1234");
      expect(logOutput).toContain("1234"); // last 4 chars shown
    });
  });

  describe("raw output", () => {
    test("prints full response JSON when --raw is set", async () => {
      const stdoutWrites: string[] = [];
      const originalWrite = process.stdout.write;
      process.stdout.write = ((chunk: unknown) => {
        stdoutWrites.push(String(chunk));
        return true;
      }) as typeof process.stdout.write;

      mockFetch(async () => {
        return jsonResponse(makeResponse({ id: "test-raw" }));
      });

      const client = new CloudflareHttpClient(tokenCreds, { raw: true });
      await client.get("/zones");

      process.stdout.write = originalWrite;

      const rawOutput = stdoutWrites.join("");
      expect(rawOutput).toContain("test-raw");
      expect(rawOutput).toContain('"success": true');
    });
  });

  describe("PUT/PATCH/DELETE", () => {
    test("PUT sends body", async () => {
      let capturedMethod = "";
      let capturedBody = "";
      mockFetch(async (_url: string, init?: RequestInit) => {
        capturedMethod = init?.method ?? "";
        capturedBody = init?.body as string;
        return jsonResponse(makeResponse({ id: "updated" }));
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);
      const result = await client.put<{ id: string }>("/zones/123", { name: "new" });

      expect(capturedMethod).toBe("PUT");
      expect(JSON.parse(capturedBody)).toEqual({ name: "new" });
      expect(result.id).toBe("updated");
    });

    test("PATCH sends body", async () => {
      let capturedMethod = "";
      mockFetch(async (_url: string, init?: RequestInit) => {
        capturedMethod = init?.method ?? "";
        return jsonResponse(makeResponse({ id: "patched" }));
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);
      await client.patch("/zones/123", { paused: true });

      expect(capturedMethod).toBe("PATCH");
    });

    test("DELETE sends correct method", async () => {
      let capturedMethod = "";
      mockFetch(async (_url: string, init?: RequestInit) => {
        capturedMethod = init?.method ?? "";
        return jsonResponse(makeResponse({ id: "deleted" }));
      });

      const client = new CloudflareHttpClient(tokenCreds, defaultFlags);
      await client.delete("/zones/123");

      expect(capturedMethod).toBe("DELETE");
    });
  });
});
