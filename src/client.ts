import type {
  CloudflareClient as ICloudflareClient,
  CloudflareResponse,
  GlobalFlags,
} from "./types/index.js";
import type { Credentials } from "./auth.js";
import { CloudflareAPIError } from "./utils/errors.js";
import { dim } from "./utils/colors.js";

const BASE_URL = "https://api.cloudflare.com/client/v4";
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff

/** Redact an auth token/key for logging: show only last 4 chars */
function redact(value: string): string {
  if (value.length <= 4) return "****";
  return `***${value.slice(-4)}`;
}

export class CloudflareHttpClient implements ICloudflareClient {
  private credentials: Credentials;
  private flags: GlobalFlags;

  constructor(credentials: Credentials, flags: GlobalFlags) {
    this.credentials = credentials;
    this.flags = flags;
  }

  private getAuthHeaders(): Record<string, string> {
    if (this.credentials.method === "token" && this.credentials.token) {
      return { Authorization: `Bearer ${this.credentials.token}` };
    }
    if (
      this.credentials.method === "key" &&
      this.credentials.apiKey &&
      this.credentials.email
    ) {
      return {
        "X-Auth-Key": this.credentials.apiKey,
        "X-Auth-Email": this.credentials.email,
      };
    }
    return {};
  }

  private logVerbose(message: string): void {
    if (this.flags.verbose) {
      process.stderr.write(`${dim(`[cf] ${message}`)}\n`);
    }
  }

  private logAuthHeaders(): string {
    if (this.credentials.method === "token" && this.credentials.token) {
      return `Authorization: Bearer ${redact(this.credentials.token)}`;
    }
    if (this.credentials.method === "key" && this.credentials.apiKey) {
      return `X-Auth-Key: ${redact(this.credentials.apiKey)}`;
    }
    return "(no auth)";
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, string>;
      isFormData?: boolean;
      formData?: FormData;
    },
  ): Promise<CloudflareResponse<T>> {
    let url = `${BASE_URL}${path}`;

    // Append query params
    if (options?.params) {
      const searchParams = new URLSearchParams();
      for (const [k, v] of Object.entries(options.params)) {
        if (v !== undefined && v !== "") {
          searchParams.set(k, v);
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      ...this.getAuthHeaders(),
    };

    let bodyValue: BodyInit | null = null;

    if (options?.formData) {
      bodyValue = options.formData;
      // Don't set Content-Type for FormData — fetch sets it with boundary
    } else if (options?.body !== undefined) {
      headers["Content-Type"] = "application/json";
      bodyValue = JSON.stringify(options.body);
    }

    let lastError: Error | null = null;

    let lastRetryReason = "network error";

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_DELAYS[attempt - 1] ?? 4000;
        this.logVerbose(`Retrying after ${lastRetryReason} in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
        await sleep(delay);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        this.logVerbose(
          `${method} ${url} [${this.logAuthHeaders()}]`,
        );

        const response = await fetch(url, {
          method,
          headers,
          body: bodyValue,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        this.logVerbose(`${response.status} ${response.statusText}`);

        // Handle rate limiting (429) with retry
        if (response.status === 429 && attempt < MAX_RETRIES) {
          lastError = new Error(`Rate limited (429)`);
          lastRetryReason = "rate limit (429)";
          continue;
        }

        const responseBody = (await response.json()) as CloudflareResponse<T>;

        // --raw mode: print full response JSON
        if (this.flags.raw) {
          process.stdout.write(JSON.stringify(responseBody, null, 2) + "\n");
        }

        // Error handling for non-success responses
        if (!response.ok || !responseBody.success) {
          const errors = responseBody.errors ?? [];
          const firstCode = errors.length > 0 ? (errors[0]?.code ?? 0) : 0;
          throw new CloudflareAPIError(response.status, firstCode, errors);
        }

        return responseBody;
      } catch (error: unknown) {
        clearTimeout(timeoutId);

        if (error instanceof CloudflareAPIError) {
          throw error;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          throw new CloudflareAPIError(408, 0, [
            { code: 0, message: `Request timed out after ${TIMEOUT_MS}ms` },
          ]);
        }

        lastError = error instanceof Error ? error : new Error(String(error));
        lastRetryReason = `network error (${lastError.message})`;

        // Only retry on network errors, not on the last attempt
        if (attempt >= MAX_RETRIES) {
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error("Request failed after all retries");
  }

  async get<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const response = await this.request<T>("GET", path, params ? { params } : undefined);
    return response.result;
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request<T>("POST", path, { body });
    return response.result;
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request<T>("PUT", path, { body });
    return response.result;
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request<T>("PATCH", path, { body });
    return response.result;
  }

  async delete<T>(path: string): Promise<T> {
    const response = await this.request<T>("DELETE", path);
    return response.result;
  }

  async upload(path: string, formData: FormData): Promise<unknown> {
    const response = await this.request<unknown>("POST", path, { formData });
    return response.result;
  }

  /**
   * Auto-paginate through all pages and return combined results.
   * Supports both page-based and cursor-based pagination.
   */
  async fetchAll<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<T[]> {
    const allResults: T[] = [];
    const queryParams = { ...params };
    let page = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      queryParams["page"] = String(page);
      if (!queryParams["per_page"]) {
        queryParams["per_page"] = "50";
      }

      const response = await this.request<T[]>("GET", path, {
        params: queryParams,
      });

      const items = response.result;
      if (!Array.isArray(items)) {
        throw new Error(
          `fetchAll: expected API to return an array for ${path}, got ${typeof items}. Use get() for single-result endpoints.`,
        );
      }

      allResults.push(...items);

      const info = response.result_info;
      if (!info) break;

      // Cursor-based pagination
      if (info.cursors?.after) {
        queryParams["cursor"] = info.cursors.after;
        delete queryParams["page"];
        page++;
        continue;
      }

      // Page-based pagination
      if (page >= info.total_pages) break;
      page++;
    }

    return allResults;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
