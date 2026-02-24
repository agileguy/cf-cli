/** Cloudflare Zone */
export interface Zone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  development_mode: number;
  name_servers: string[];
  original_name_servers: string[];
  original_registrar: string | null;
  original_dnshost: string | null;
  modified_on: string;
  created_on: string;
  activated_on: string;
  meta: {
    step: number;
    custom_certificate_quota: number;
    page_rule_quota: number;
    phishing_detected: boolean;
    multiple_railguns_allowed: boolean;
  };
  owner: {
    id: string;
    type: string;
    email?: string | undefined;
  };
  account: {
    id: string;
    name: string;
  };
  permissions: string[];
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    frequency: string;
    is_subscribed: boolean;
    can_subscribe: boolean;
    legacy_id: string;
    legacy_discount: boolean;
    externally_managed: boolean;
  };
}

/** DNS Record */
export interface DnsRecord {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  locked: boolean;
  meta: {
    auto_added: boolean;
    managed_by_apps: boolean;
    managed_by_argo_tunnel: boolean;
    source: string;
  };
  comment: string | null;
  tags: string[];
  created_on: string;
  modified_on: string;
  priority?: number | undefined;
  data?: Record<string, unknown> | undefined;
}

/** Account */
export interface Account {
  id: string;
  name: string;
  type: string;
  settings: {
    enforce_twofactor: boolean;
    use_account_custom_ns_by_default: boolean;
  };
  created_on: string;
}

/** User */
export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string;
  telephone: string | null;
  country: string | null;
  zipcode: string | null;
  created_on: string;
  modified_on: string;
  two_factor_authentication_enabled: boolean;
  suspended: boolean;
}

/** Cache Purge Result */
export interface CachePurgeResult {
  id: string;
}

/** Token verification result */
export interface TokenVerifyResult {
  id: string;
  status: string;
  not_before?: string | undefined;
  expires_on?: string | undefined;
}

/** DNS import result */
export interface DnsImportResult {
  recs_added: number;
  total_records_parsed: number;
}

// ─── Workers Types ──────────────────────────────────────────────────────────

/** Workers Script */
export interface WorkerScript {
  id: string;
  etag: string;
  handlers: string[];
  named_handlers?: { name: string; type: string }[] | undefined;
  modified_on: string;
  created_on: string;
  usage_model?: string | undefined;
  compatibility_date?: string | undefined;
  compatibility_flags?: string[] | undefined;
  last_deployed_from?: string | undefined;
  logpush?: boolean | undefined;
  placement_mode?: string | undefined;
  tail_consumers?: { service: string; namespace?: string }[] | undefined;
}

/** Workers Route */
export interface WorkerRoute {
  id: string;
  pattern: string;
  script: string;
}

/** Workers Cron Trigger */
export interface WorkerCronTrigger {
  cron: string;
  created_on: string;
  modified_on: string;
}

/** Workers Cron Schedule response (wraps schedules array) */
export interface WorkerCronSchedule {
  schedules: WorkerCronTrigger[];
}

/** Workers Custom Domain */
export interface WorkerDomain {
  id: string;
  zone_id: string;
  zone_name: string;
  hostname: string;
  service: string;
  environment: string;
}

/** Workers Script Version */
export interface WorkerVersion {
  id: string;
  number: number;
  metadata: Record<string, unknown>;
  created_on: string;
  annotations?: Record<string, string> | undefined;
}

/** Workers for Platforms - Dispatch Namespace */
export interface WorkerNamespace {
  namespace_id: string;
  namespace_name: string;
  created_on: string;
  modified_on: string;
  class?: string | undefined;
  script_count?: number | undefined;
}

/** Workers for Platforms - Namespace Script */
export interface WorkerNamespaceScript {
  id: string;
  created_on: string;
  modified_on: string;
  etag?: string | undefined;
}

/** Workers Tail */
export interface WorkerTail {
  id: string;
  url: string;
  expires_at: string;
}

/** Workers Tail Event (received via WebSocket) */
export interface WorkerTailEvent {
  scriptName?: string | undefined;
  event?: Record<string, unknown> | undefined;
  eventTimestamp?: number | undefined;
  outcome: string;
  logs: { level: string; message: string[]; timestamp: number }[];
  exceptions: { name: string; message: string; timestamp: number }[];
  diagnosticsChannelEvents?: unknown[] | undefined;
}
