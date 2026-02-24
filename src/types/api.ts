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

// ─── Workers KV Types ───────────────────────────────────────────────────────

/** KV Namespace */
export interface KVNamespace {
  id: string;
  title: string;
  supports_url_encoding?: boolean | undefined;
}

/** KV Key (from list keys endpoint) */
export interface KVKey {
  name: string;
  expiration?: number | undefined;
  metadata?: Record<string, unknown> | undefined;
}

/** KV Key list result info (cursor-based pagination) */
export interface KVKeyListResult {
  keys: KVKey[];
  list_complete: boolean;
  cursor?: string | undefined;
  result_info?: {
    count: number;
    cursor?: string | undefined;
  } | undefined;
}

/** KV bulk write entry */
export interface KVBulkWriteEntry {
  key: string;
  value: string;
  expiration?: number | undefined;
  expiration_ttl?: number | undefined;
  metadata?: Record<string, unknown> | undefined;
  base64?: boolean | undefined;
}

// ─── Durable Objects Types ──────────────────────────────────────────────────

/** Durable Object Namespace */
export interface DurableObjectNamespace {
  id: string;
  name: string;
  script?: string | undefined;
  class?: string | undefined;
  environment?: string | undefined;
}

/** Durable Object instance */
export interface DurableObject {
  id: string;
  hasStoredData: boolean;
}

// ─── R2 Types ──────────────────────────────────────────────────────────────

/** R2 Bucket */
export interface R2Bucket {
  name: string;
  creation_date: string;
  location?: string | undefined;
  storage_class?: string | undefined;
}

/** R2 CORS Rule */
export interface R2CorsRule {
  allowed_origins: string[];
  allowed_methods: string[];
  allowed_headers?: string[] | undefined;
  expose_headers?: string[] | undefined;
  max_age_seconds?: number | undefined;
}

/** R2 Lifecycle Rule */
export interface R2LifecycleRule {
  id: string;
  enabled: boolean;
  conditions?: {
    prefix?: string | undefined;
    max_age_days?: number | undefined;
  } | undefined;
  action: {
    type: string;
    storage_class?: string | undefined;
  };
}

/** R2 Custom Domain */
export interface R2CustomDomain {
  domain: string;
  bucket_name: string;
  zone_id?: string | undefined;
  zone_name?: string | undefined;
  status: string;
  min_tls?: string | undefined;
  enabled: boolean;
  created_at?: string | undefined;
}

/** R2 Event Notification Rule */
export interface R2EventNotificationRule {
  queue_id: string;
  queue_name?: string | undefined;
  event_types: string[];
  prefix?: string | undefined;
  suffix?: string | undefined;
  created_at?: string | undefined;
}

/** R2 Event Notification Config (response wrapper) */
export interface R2EventNotificationConfig {
  bucketName: string;
  rules: R2EventNotificationRule[];
}

/** R2 Bucket Metrics */
export interface R2Metrics {
  object_count: number;
  payload_size: number;
  metadata_size: number;
  upload_count: number;
  operations: {
    class_a: number;
    class_b: number;
  };
}

// ─── D1 Types ──────────────────────────────────────────────────────────────

/** D1 Database */
export interface D1Database {
  uuid: string;
  name: string;
  version: string;
  num_tables?: number | undefined;
  file_size?: number | undefined;
  running_in_region?: string | undefined;
  created_at: string;
}

/** D1 Query Result */
export interface D1QueryResult {
  results: Record<string, unknown>[];
  success: boolean;
  meta: {
    served_by: string;
    duration: number;
    changes: number;
    last_row_id: number;
    changed_db: boolean;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
}

// ─── Pages Types ───────────────────────────────────────────────────────────

/** Pages Project */
export interface PagesProject {
  id: string;
  name: string;
  subdomain: string;
  domains: string[];
  source?: {
    type: string;
    config?: {
      owner: string;
      repo_name: string;
      production_branch: string;
      pr_comments_enabled?: boolean | undefined;
      deployments_enabled?: boolean | undefined;
    } | undefined;
  } | undefined;
  build_config?: {
    build_command?: string | undefined;
    destination_dir?: string | undefined;
    root_dir?: string | undefined;
    web_analytics_tag?: string | undefined;
    web_analytics_token?: string | undefined;
  } | undefined;
  deployment_configs?: {
    production?: PagesDeploymentConfig | undefined;
    preview?: PagesDeploymentConfig | undefined;
  } | undefined;
  latest_deployment?: PagesDeployment | undefined;
  canonical_deployment?: PagesDeployment | undefined;
  production_branch: string;
  created_on: string;
  production_script_name?: string | undefined;
}

/** Pages Deployment Config */
export interface PagesDeploymentConfig {
  env_vars?: Record<string, { value: string; type?: string }> | undefined;
  compatibility_date?: string | undefined;
  compatibility_flags?: string[] | undefined;
}

/** Pages Deployment */
export interface PagesDeployment {
  id: string;
  short_id: string;
  project_id: string;
  project_name: string;
  environment: string;
  url: string;
  created_on: string;
  modified_on: string;
  aliases?: string[] | undefined;
  latest_stage: {
    name: string;
    started_on: string | null;
    ended_on: string | null;
    status: string;
  };
  deployment_trigger?: {
    type: string;
    metadata?: {
      branch: string;
      commit_hash: string;
      commit_message: string;
    } | undefined;
  } | undefined;
  stages: {
    name: string;
    started_on: string | null;
    ended_on: string | null;
    status: string;
  }[];
  build_config?: {
    build_command?: string | undefined;
    destination_dir?: string | undefined;
    root_dir?: string | undefined;
  } | undefined;
  source?: {
    type: string;
    config?: {
      owner: string;
      repo_name: string;
      production_branch: string;
    } | undefined;
  } | undefined;
  production_branch?: string | undefined;
}

/** Pages Custom Domain */
export interface PagesDomain {
  id: string;
  name: string;
  status: string;
  verification_type?: string | undefined;
  verification_data?: {
    status: string;
  } | undefined;
  ssl?: {
    status: string;
  } | undefined;
  created_on: string;
}

// ─── Queues Types ──────────────────────────────────────────────────────────

/** Queue */
export interface Queue {
  queue_id: string;
  queue_name: string;
  created_on: string;
  modified_on: string;
  producers_total_count: number;
  consumers_total_count: number;
  producers?: QueueProducer[] | undefined;
  consumers?: QueueConsumer[] | undefined;
}

/** Queue Producer (worker binding) */
export interface QueueProducer {
  service: string;
  environment?: string | undefined;
  namespace?: string | undefined;
}

/** Queue Consumer */
export interface QueueConsumer {
  service: string;
  environment?: string | undefined;
  queue_name: string;
  created_on: string;
  dead_letter_queue?: string | undefined;
  settings?: QueueConsumerSettings | undefined;
}

/** Queue Consumer Settings */
export interface QueueConsumerSettings {
  batch_size?: number | undefined;
  max_retries?: number | undefined;
  max_wait_time_ms?: number | undefined;
  max_concurrency?: number | undefined;
  visibility_timeout_ms?: number | undefined;
  retry_delay?: number | undefined;
}

/** Queue Message send result */
export interface QueueMessageSendResult {
  message_id: string;
}

// ─── Hyperdrive Types ──────────────────────────────────────────────────────

/** Hyperdrive configuration */
export interface HyperdriveConfig {
  id: string;
  name: string;
  origin: HyperdriveOrigin;
  caching?: HyperdriveCaching | undefined;
  created_on?: string | undefined;
  modified_on?: string | undefined;
}

/** Hyperdrive origin database connection */
export interface HyperdriveOrigin {
  host: string;
  port: number;
  database: string;
  scheme: string;
  user?: string | undefined;
}

/** Hyperdrive caching settings */
export interface HyperdriveCaching {
  disabled?: boolean | undefined;
  max_age?: number | undefined;
  stale_while_revalidate?: number | undefined;
}

// ─── Pipelines Types ───────────────────────────────────────────────────────

/** Pipeline */
export interface Pipeline {
  id: string;
  name: string;
  endpoint: string;
  created_on?: string | undefined;
  modified_on?: string | undefined;
  source?: PipelineSource[] | undefined;
  destination?: PipelineDestination | undefined;
}

/** Pipeline source */
export interface PipelineSource {
  type: string;
  format?: string | undefined;
  service?: string | undefined;
}

/** Pipeline destination */
export interface PipelineDestination {
  type: string;
  format?: string | undefined;
  path?: PipelineDestinationPath | undefined;
  batch?: PipelineDestinationBatch | undefined;
  compression?: PipelineDestinationCompression | undefined;
  credentials?: Record<string, unknown> | undefined;
}

/** Pipeline destination path configuration */
export interface PipelineDestinationPath {
  bucket: string;
  prefix?: string | undefined;
}

/** Pipeline destination batch configuration */
export interface PipelineDestinationBatch {
  max_bytes?: number | undefined;
  max_duration_s?: number | undefined;
  max_rows?: number | undefined;
}

/** Pipeline destination compression */
export interface PipelineDestinationCompression {
  type: string;
}

// ─── Secrets Store Types ───────────────────────────────────────────────────

/** Secrets Store */
export interface SecretsStore {
  id: string;
  name: string;
  created_on?: string | undefined;
  modified_on?: string | undefined;
  status?: string | undefined;
}

/** Secrets Store Secret */
export interface SecretsStoreSecret {
  name: string;
  value?: string | undefined;
  comment?: string | undefined;
  created_on?: string | undefined;
  modified_on?: string | undefined;
  status?: string | undefined;
}
