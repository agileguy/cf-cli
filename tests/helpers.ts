/**
 * Test helpers: mock client, mock output, and context factory.
 */

import type { CloudflareClient, OutputFormatter, Context, GlobalFlags, Config } from "../src/types/index.js";

/** Create a mock CloudflareClient */
export function mockClient(overrides: Partial<CloudflareClient> = {}): CloudflareClient {
  return {
    get: overrides.get ?? (async () => ({})),
    post: overrides.post ?? (async () => ({})),
    put: overrides.put ?? (async () => ({})),
    patch: overrides.patch ?? (async () => ({})),
    delete: overrides.delete ?? (async () => ({})),
    fetchAll: overrides.fetchAll ?? (async () => []),
    upload: overrides.upload ?? (async () => ({})),
    uploadPut: overrides.uploadPut ?? (async () => ({})),
  };
}

/** Captured output from mock formatter */
export interface CapturedOutput {
  tables: { data: unknown[]; columns: unknown[] }[];
  jsons: unknown[];
  csvs: { data: unknown[]; columns: unknown[] }[];
  yamls: unknown[];
  raws: unknown[];
  successes: string[];
  errors: string[];
  warnings: string[];
  infos: string[];
  details: Record<string, unknown>[];
}

/** Create a mock OutputFormatter that captures all output */
export function mockOutput(): OutputFormatter & { captured: CapturedOutput } {
  const captured: CapturedOutput = {
    tables: [],
    jsons: [],
    csvs: [],
    yamls: [],
    raws: [],
    successes: [],
    errors: [],
    warnings: [],
    infos: [],
    details: [],
  };

  return {
    captured,
    table(data: unknown[], columns: unknown[]) {
      captured.tables.push({ data, columns });
    },
    json(data: unknown) {
      captured.jsons.push(data);
    },
    csv(data: unknown[], columns: unknown[]) {
      captured.csvs.push({ data, columns });
    },
    yaml(data: unknown) {
      captured.yamls.push(data);
    },
    raw(data: unknown) {
      captured.raws.push(data);
    },
    success(message: string) {
      captured.successes.push(message);
    },
    error(message: string) {
      captured.errors.push(message);
    },
    warn(message: string) {
      captured.warnings.push(message);
    },
    info(message: string) {
      captured.infos.push(message);
    },
    detail(data: Record<string, unknown>) {
      captured.details.push(data);
    },
  };
}

/** Create a test Context with mocked client and output */
export function createTestContext(
  clientOverrides: Partial<CloudflareClient> = {},
  flagOverrides: Partial<GlobalFlags> = {},
): { ctx: Context; output: ReturnType<typeof mockOutput>; client: CloudflareClient } {
  const client = mockClient(clientOverrides);
  const output = mockOutput();
  const flags: GlobalFlags = {
    yes: true, // Auto-confirm in tests
    ...flagOverrides,
  };
  const config: Config = {
    version: 1,
    default_profile: "default",
    profiles: {},
    defaults: {
      output: "table",
      no_color: false,
      per_page: 20,
    },
  };

  const ctx: Context = { client, output, flags, config };
  return { ctx, output, client };
}

/** Sample zone data for tests */
export function sampleZone(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "023e105f4ecef8ad9ca31a8372d0c353",
    name: "example.com",
    status: "active",
    paused: false,
    type: "full",
    development_mode: 0,
    name_servers: ["ns1.cloudflare.com", "ns2.cloudflare.com"],
    original_name_servers: ["ns1.original.com", "ns2.original.com"],
    original_registrar: "registrar.com",
    original_dnshost: null,
    created_on: "2023-01-15T10:30:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    activated_on: "2023-01-15T11:00:00.000Z",
    meta: {
      step: 2,
      custom_certificate_quota: 1,
      page_rule_quota: 3,
      phishing_detected: false,
      multiple_railguns_allowed: false,
    },
    owner: { id: "abc123", type: "user" },
    account: { id: "abc123def456abc123def456abc12345", name: "Test Account" },
    permissions: ["#zone:read"],
    plan: {
      id: "plan123",
      name: "Free",
      price: 0,
      currency: "USD",
      frequency: "monthly",
      is_subscribed: true,
      can_subscribe: true,
      legacy_id: "free",
      legacy_discount: false,
      externally_managed: false,
    },
    ...overrides,
  };
}

/** Sample DNS record for tests */
export function sampleDnsRecord(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "372e67954025e0ba6aaa6d586b9e0b59",
    zone_id: "023e105f4ecef8ad9ca31a8372d0c353",
    zone_name: "example.com",
    name: "www.example.com",
    type: "A",
    content: "1.2.3.4",
    proxiable: true,
    proxied: true,
    ttl: 1,
    locked: false,
    meta: {
      auto_added: false,
      managed_by_apps: false,
      managed_by_argo_tunnel: false,
      source: "primary",
    },
    comment: null,
    tags: [],
    created_on: "2023-06-01T10:00:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

/** Sample account for tests */
export function sampleAccount(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "abc123def456abc123def456abc12345",
    name: "Test Account",
    type: "standard",
    settings: {
      enforce_twofactor: false,
      use_account_custom_ns_by_default: false,
    },
    created_on: "2022-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Sample user for tests */
export function sampleUser(): Record<string, unknown> {
  return {
    id: "user123",
    email: "test@example.com",
    first_name: "Test",
    last_name: "User",
    username: "testuser",
    telephone: null,
    country: null,
    zipcode: null,
    created_on: "2022-01-01T00:00:00.000Z",
    modified_on: "2024-01-01T00:00:00.000Z",
    two_factor_authentication_enabled: true,
    suspended: false,
  };
}

/** Sample worker script for tests */
export function sampleWorkerScript(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "my-worker",
    etag: "abc123etag",
    handlers: ["fetch"],
    modified_on: "2024-06-01T12:00:00.000Z",
    created_on: "2024-01-01T00:00:00.000Z",
    usage_model: "standard",
    compatibility_date: "2024-01-01",
    compatibility_flags: [],
    last_deployed_from: "wrangler",
    logpush: false,
    ...overrides,
  };
}

/** Sample worker route for tests */
export function sampleWorkerRoute(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "route123abc",
    pattern: "example.com/*",
    script: "my-worker",
    ...overrides,
  };
}

/** Sample worker cron schedule for tests */
export function sampleWorkerCronSchedule(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    schedules: [
      {
        cron: "*/5 * * * *",
        created_on: "2024-01-01T00:00:00.000Z",
        modified_on: "2024-06-01T12:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

/** Sample worker domain for tests */
export function sampleWorkerDomain(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "domain123",
    zone_id: "023e105f4ecef8ad9ca31a8372d0c353",
    zone_name: "example.com",
    hostname: "api.example.com",
    service: "my-worker",
    environment: "production",
    ...overrides,
  };
}

/** Sample worker version for tests */
export function sampleWorkerVersion(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "version-uuid-123",
    number: 1,
    metadata: {},
    created_on: "2024-06-01T12:00:00.000Z",
    annotations: {},
    ...overrides,
  };
}

/** Sample worker namespace for tests */
export function sampleWorkerNamespace(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    namespace_id: "ns-uuid-123",
    namespace_name: "my-namespace",
    created_on: "2024-01-01T00:00:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    script_count: 5,
    ...overrides,
  };
}

/** Sample worker namespace script for tests */
export function sampleWorkerNamespaceScript(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "ns-script-1",
    created_on: "2024-01-01T00:00:00.000Z",
    modified_on: "2024-06-01T12:00:00.000Z",
    ...overrides,
  };
}

/** Sample worker tail for tests */
export function sampleWorkerTail(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "tail-uuid-123",
    url: "wss://tail.workers.dev/abc123",
    expires_at: "2024-06-01T13:00:00.000Z",
    ...overrides,
  };
}

/** Sample KV namespace for tests */
export function sampleKVNamespace(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "kv-ns-uuid-123",
    title: "MY_KV_NAMESPACE",
    supports_url_encoding: true,
    ...overrides,
  };
}

/** Sample KV key for tests */
export function sampleKVKey(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    name: "my-key",
    expiration: 1700000000,
    metadata: { env: "production" },
    ...overrides,
  };
}

/** Sample Durable Object namespace for tests */
export function sampleDurableObjectNamespace(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "do-ns-uuid-123",
    name: "MY_DURABLE_OBJECT",
    script: "my-worker",
    class: "MyDurableObject",
    ...overrides,
  };
}

/** Sample Durable Object for tests */
export function sampleDurableObject(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "do-obj-uuid-123",
    hasStoredData: true,
    ...overrides,
  };
}
