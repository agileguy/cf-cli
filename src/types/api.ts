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

// ─── Rulesets Types ─────────────────────────────────────────────────────────

/** Ruleset */
export interface Ruleset {
  id: string;
  name: string;
  description?: string | undefined;
  kind: string;
  phase?: string | undefined;
  version?: string | undefined;
  last_updated?: string | undefined;
  rules?: RulesetRule[] | undefined;
}

/** Ruleset Rule */
export interface RulesetRule {
  id?: string | undefined;
  version?: string | undefined;
  action: string;
  expression: string;
  description?: string | undefined;
  enabled?: boolean | undefined;
  ref?: string | undefined;
  logging?: { enabled: boolean } | undefined;
  action_parameters?: Record<string, unknown> | undefined;
  last_updated?: string | undefined;
}

/** Ruleset Phase entrypoint */
export interface RulesetPhase {
  phase: string;
  description?: string | undefined;
}

// ─── Firewall Legacy Types ──────────────────────────────────────────────────

/** Firewall Access Rule (IP rule) */
export interface FirewallIPRule {
  id: string;
  mode: string;
  notes?: string | undefined;
  configuration: {
    target: string;
    value: string;
  };
  scope?: {
    id: string;
    type: string;
    email?: string | undefined;
  } | undefined;
  created_on?: string | undefined;
  modified_on?: string | undefined;
}

/** Firewall User-Agent Rule */
export interface FirewallUARule {
  id: string;
  description?: string | undefined;
  mode: string;
  paused: boolean;
  configuration: {
    target: string;
    value: string;
  };
}

/** Firewall Zone Lockdown */
export interface FirewallZoneLockdown {
  id: string;
  description?: string | undefined;
  paused: boolean;
  urls: string[];
  configurations: {
    target: string;
    value: string;
  }[];
  created_on?: string | undefined;
  modified_on?: string | undefined;
}

// ─── Page Shield Types ──────────────────────────────────────────────────────

/** Page Shield Settings */
export interface PageShieldSettings {
  enabled: boolean;
  updated_at?: string | undefined;
  use_cloudflare_reporting_endpoint?: boolean | undefined;
  use_connection_url_path?: boolean | undefined;
}

/** Page Shield Script */
export interface PageShieldScript {
  id: string;
  url: string;
  added_at?: string | undefined;
  first_seen_at?: string | undefined;
  last_seen_at?: string | undefined;
  host?: string | undefined;
  domain_reported_malicious?: boolean | undefined;
  fetched_at?: string | undefined;
  hash?: string | undefined;
  js_integrity_score?: number | undefined;
  page_urls?: string[] | undefined;
}

/** Page Shield Connection */
export interface PageShieldConnection {
  id: string;
  url: string;
  added_at?: string | undefined;
  first_seen_at?: string | undefined;
  last_seen_at?: string | undefined;
  host?: string | undefined;
  domain_reported_malicious?: boolean | undefined;
  page_urls?: string[] | undefined;
}

/** Page Shield Policy */
export interface PageShieldPolicy {
  id: string;
  value: string;
  action: string;
  description?: string | undefined;
  enabled?: boolean | undefined;
  expression?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
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

// ─── Turnstile Types ────────────────────────────────────────────────────────

/** Turnstile Widget */
export interface TurnstileWidget {
  sitekey: string;
  secret: string;
  name: string;
  domains: string[];
  mode: string;
  bot_fight_mode: boolean;
  region?: string | undefined;
  created_on: string;
  modified_on: string;
  offlabel?: boolean | undefined;
  clearance_level?: string | undefined;
}

/** Turnstile Widget Rotate Secret Result */
export interface TurnstileRotateSecretResult {
  sitekey: string;
  secret: string;
  name: string;
  domains: string[];
  mode: string;
  created_on: string;
  modified_on: string;
}

// ─── API Gateway Types ──────────────────────────────────────────────────────

/** API Gateway Settings */
export interface APIGatewaySettings {
  enabled: boolean;
}

/** API Gateway Schema */
export interface APIGatewaySchema {
  schema_id: string;
  name: string;
  kind?: string | undefined;
  source?: string | undefined;
  created_at?: string | undefined;
  validation_enabled?: boolean | undefined;
}

// ─── Access (Zero Trust) Types ──────────────────────────────────────────────

/** Access Application */
export interface AccessApplication {
  id: string;
  name: string;
  domain: string;
  type?: string | undefined;
  session_duration?: string | undefined;
  allowed_idps?: string[] | undefined;
  auto_redirect_to_identity?: boolean | undefined;
  enable_binding_cookie?: boolean | undefined;
  custom_deny_message?: string | undefined;
  custom_deny_url?: string | undefined;
  cors_headers?: Record<string, unknown> | undefined;
  skip_interstitial?: boolean | undefined;
  app_launcher_visible?: boolean | undefined;
  service_auth_401_redirect?: boolean | undefined;
  logo_url?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
  aud?: string | undefined;
}

/** Access Policy */
export interface AccessPolicy {
  id: string;
  name: string;
  decision: string;
  precedence: number;
  include: AccessPolicyRule[];
  exclude?: AccessPolicyRule[] | undefined;
  require?: AccessPolicyRule[] | undefined;
  purpose_justification_required?: boolean | undefined;
  purpose_justification_prompt?: string | undefined;
  approval_required?: boolean | undefined;
  approval_groups?: { name: string; email_list_uuid?: string }[] | undefined;
  isolation_required?: boolean | undefined;
  session_duration?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

/** Access Policy Rule (include/exclude/require element) */
export interface AccessPolicyRule {
  email?: { email: string } | undefined;
  email_domain?: { domain: string } | undefined;
  everyone?: Record<string, never> | undefined;
  ip?: { ip: string } | undefined;
  group?: { id: string } | undefined;
  certificate?: Record<string, never> | undefined;
  service_token?: { token_id: string } | undefined;
  any_valid_service_token?: Record<string, never> | undefined;
  external_evaluation?: { evaluate_url: string; keys_url: string } | undefined;
  geo?: { country_code: string } | undefined;
  login_method?: { id: string } | undefined;
  common_name?: { common_name: string } | undefined;
}

/** Access Service Token */
export interface AccessServiceToken {
  id: string;
  name: string;
  client_id: string;
  client_secret?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
  expires_at?: string | undefined;
  duration?: string | undefined;
}

/** Access Group */
export interface AccessGroup {
  id: string;
  name: string;
  include: AccessPolicyRule[];
  exclude?: AccessPolicyRule[] | undefined;
  require?: AccessPolicyRule[] | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

/** Access User */
export interface AccessUser {
  id: string;
  name?: string | undefined;
  email?: string | undefined;
  access_seat?: boolean | undefined;
  gateway_seat?: boolean | undefined;
  seat_uid?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
  last_successful_login?: string | undefined;
}

/** Access User Session */
export interface AccessUserSession {
  account_id?: string | undefined;
  auth_status?: string | undefined;
  common_name?: string | undefined;
  devicePosture?: Record<string, unknown> | undefined;
  email?: string | undefined;
  geo?: Record<string, unknown> | undefined;
  iat?: number | undefined;
  idp?: { id: string; type: string } | undefined;
  ip?: string | undefined;
  is_gateway?: boolean | undefined;
  is_warp?: boolean | undefined;
  mtls_auth?: Record<string, unknown> | undefined;
  service_token_id?: string | undefined;
  service_token_status?: boolean | undefined;
  user_uuid?: string | undefined;
  version?: number | undefined;
}

/** Access Certificate (mTLS) */
export interface AccessCertificate {
  id: string;
  name: string;
  fingerprint?: string | undefined;
  associated_hostnames?: string[] | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
  expires_on?: string | undefined;
}

/** Access Identity Provider */
export interface AccessIdentityProvider {
  id: string;
  name: string;
  type: string;
  config?: Record<string, unknown> | undefined;
  scim_config?: Record<string, unknown> | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

// ─── Gateway (Zero Trust) Types ─────────────────────────────────────────────

/** Gateway DNS/HTTP/Network Policy */
export interface GatewayPolicy {
  id: string;
  name: string;
  description?: string | undefined;
  precedence?: number | undefined;
  enabled?: boolean | undefined;
  action: string;
  filters?: string[] | undefined;
  traffic?: string | undefined;
  identity?: string | undefined;
  device_posture?: string | undefined;
  rule_settings?: Record<string, unknown> | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

/** Gateway DLP Profile */
export interface GatewayDLPProfile {
  id: string;
  name: string;
  type?: string | undefined;
  description?: string | undefined;
  entries?: GatewayDLPEntry[] | undefined;
  allowed_match_count?: number | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

/** Gateway DLP Profile Entry */
export interface GatewayDLPEntry {
  id?: string | undefined;
  name: string;
  enabled?: boolean | undefined;
  profile_id?: string | undefined;
  pattern?: {
    regex: string;
    validation?: string | undefined;
  } | undefined;
}

// ─── Rate Limits Types ──────────────────────────────────────────────────────

/** Rate Limit Rule (Legacy) */
export interface RateLimitRule {
  id: string;
  disabled?: boolean | undefined;
  description?: string | undefined;
  match: {
    request: {
      methods?: string[] | undefined;
      schemes?: string[] | undefined;
      url: string;
    };
    response?: {
      status?: number[] | undefined;
      origin_traffic?: boolean | undefined;
      headers?: { name: string; op: string; value: string }[] | undefined;
    } | undefined;
  };
  threshold: number;
  period: number;
  action: {
    mode: string;
    timeout?: number | undefined;
    response?: {
      content_type: string;
      body: string;
    } | undefined;
  };
  bypass?: { name: string; value: string }[] | undefined;
  correlate?: { by: string } | undefined;
}

// ─── Cloudflare Tunnel Types ───────────────────────────────────────────────

/** Cloudflare Tunnel */
export interface CfdTunnel {
  id: string;
  name: string;
  status: string;
  created_at: string;
  deleted_at?: string | undefined;
  account_tag?: string | undefined;
  conns_active_at?: string | undefined;
  conns_inactive_at?: string | undefined;
  tun_type?: string | undefined;
  remote_config?: boolean | undefined;
  connections?: CfdTunnelConnection[] | undefined;
}

/** Cloudflare Tunnel Connection */
export interface CfdTunnelConnection {
  id: string;
  colo_name: string;
  is_pending_reconnect: boolean;
  origin_ip?: string | undefined;
  opened_at: string;
  client_id?: string | undefined;
  client_version?: string | undefined;
}

/** Cloudflare Tunnel Configuration */
export interface CfdTunnelConfig {
  config?: {
    ingress?: CfdTunnelIngress[] | undefined;
    warp_routing?: { enabled?: boolean | undefined } | undefined;
    originRequest?: Record<string, unknown> | undefined;
  } | undefined;
}

/** Cloudflare Tunnel Ingress Rule */
export interface CfdTunnelIngress {
  hostname?: string | undefined;
  service: string;
  path?: string | undefined;
  originRequest?: Record<string, unknown> | undefined;
}

/** Cloudflare Tunnel Token */
export interface CfdTunnelToken {
  token: string;
}

// ─── Device Management Types ───────────────────────────────────────────────

/** Zero Trust Device */
export interface ZTDevice {
  id: string;
  name?: string | undefined;
  device_type?: string | undefined;
  version?: string | undefined;
  ip?: string | undefined;
  mac_address?: string | undefined;
  os_version?: string | undefined;
  os_distro_name?: string | undefined;
  os_distro_revision?: string | undefined;
  serial_number?: string | undefined;
  user?: {
    id: string;
    name?: string | undefined;
    email?: string | undefined;
  } | undefined;
  key?: string | undefined;
  last_seen?: string | undefined;
  created?: string | undefined;
  updated?: string | undefined;
  revoked_at?: string | undefined;
  deleted_at?: string | undefined;
}

/** Device Registration */
export interface DeviceRegistration {
  id: string;
  device_id?: string | undefined;
  user?: {
    id: string;
    email?: string | undefined;
  } | undefined;
  created_at?: string | undefined;
  status?: string | undefined;
}

/** Device Posture Rule */
export interface DevicePostureRule {
  id: string;
  name: string;
  type: string;
  description?: string | undefined;
  schedule?: string | undefined;
  expiration?: string | undefined;
  match?: DevicePostureMatch[] | undefined;
  input?: Record<string, unknown> | undefined;
}

/** Device Posture Match criteria */
export interface DevicePostureMatch {
  platform?: string | undefined;
}

// ─── WARP Types ────────────────────────────────────────────────────────────

/** WARP Settings (Device Settings Policy) */
export interface WARPSettings {
  disable_auto_fallback?: boolean | undefined;
  captive_portal?: number | undefined;
  allowed_to_leave?: boolean | undefined;
  switch_locked?: boolean | undefined;
  auto_connect?: number | undefined;
  default?: boolean | undefined;
  exclude_office_ips?: boolean | undefined;
  service_mode_v2?: {
    mode?: string | undefined;
    port?: number | undefined;
  } | undefined;
  gateway_unique_id?: string | undefined;
  support_url?: string | undefined;
  precedence?: number | undefined;
  name?: string | undefined;
  match?: string | undefined;
  enabled?: boolean | undefined;
}

/** Split Tunnel entry (include or exclude) */
export interface SplitTunnelEntry {
  address: string;
  description?: string | undefined;
  host?: string | undefined;
}

/** WARP Fleet Status device */
export interface FleetStatusDevice {
  device_id: string;
  device_name?: string | undefined;
  device_type?: string | undefined;
  status?: string | undefined;
  colo?: string | undefined;
  mode?: string | undefined;
  platform?: string | undefined;
  version?: string | undefined;
  ip?: string | undefined;
  last_seen?: string | undefined;
}

// ─── SSL / TLS Types ───────────────────────────────────────────────────────

/** SSL Analyze result */
export interface SSLAnalyzeResult {
  hostname: string;
  certificate_status?: string | undefined;
  certificate_authority?: string | undefined;
  valid_from?: string | undefined;
  valid_to?: string | undefined;
  signature_algorithm?: string | undefined;
  fingerprint_sha256?: string | undefined;
  issuer?: string | undefined;
  subject?: string | undefined;
  sans?: string[] | undefined;
}

/** Universal SSL Settings */
export interface UniversalSSLSettings {
  enabled: boolean;
}

/** Universal SSL Verification entry */
export interface SSLVerification {
  certificate_status: string;
  brand_check?: boolean | undefined;
  verification_type?: string | undefined;
  verification_info?: Record<string, unknown> | undefined;
  cert_pack_uuid?: string | undefined;
  validation_method?: string | undefined;
  hostname?: string | undefined;
}

/** Advanced Certificate Pack */
export interface AdvancedCertificatePack {
  id: string;
  type: string;
  hosts: string[];
  status: string;
  validation_method?: string | undefined;
  validity_days?: number | undefined;
  certificate_authority?: string | undefined;
  cloudflare_branding?: boolean | undefined;
  created_on?: string | undefined;
  primary_certificate?: string | undefined;
  certificates?: SSLCertificateEntry[] | undefined;
}

/** SSL Certificate entry within a pack */
export interface SSLCertificateEntry {
  id?: string | undefined;
  hosts?: string[] | undefined;
  issuer?: string | undefined;
  signature?: string | undefined;
  status?: string | undefined;
  bundle_method?: string | undefined;
  uploaded_on?: string | undefined;
  modified_on?: string | undefined;
  expires_on?: string | undefined;
}

/** Custom SSL Certificate */
export interface CustomSSLCertificate {
  id: string;
  hosts: string[];
  issuer: string;
  signature: string;
  status: string;
  bundle_method: string;
  zone_id: string;
  uploaded_on: string;
  modified_on: string;
  expires_on: string;
  priority?: number | undefined;
  geo_restrictions?: { label: string } | undefined;
  keyless_server?: { id: string; name: string; host: string; port: number } | undefined;
}

/** Client Certificate (mTLS) */
export interface ClientCertificate {
  id: string;
  certificate: string;
  csr?: string | undefined;
  ski?: string | undefined;
  serial_number?: string | undefined;
  fingerprint_sha256?: string | undefined;
  status: string;
  expires_on?: string | undefined;
  issued_on?: string | undefined;
  location?: string | undefined;
  certificate_authority?: { id: string; name: string } | undefined;
}

/** Keyless SSL Server */
export interface KeylessSSLServer {
  id: string;
  name: string;
  host: string;
  port: number;
  status: string;
  enabled: boolean;
  permissions?: string[] | undefined;
  created_on?: string | undefined;
  modified_on?: string | undefined;
}

/** Origin CA Certificate */
export interface OriginCACertificate {
  id: string;
  certificate: string;
  hostnames: string[];
  expires_on: string;
  request_type: string;
  requested_validity: number;
  csr?: string | undefined;
}

/** mTLS Certificate Association (Account-level) */
export interface MTLSCertificateAssociation {
  id: string;
  name?: string | undefined;
  fingerprint?: string | undefined;
  associated_hostnames?: string[] | undefined;
  issuer?: string | undefined;
  serial_number?: string | undefined;
  not_before?: string | undefined;
  not_after?: string | undefined;
  uploaded_on?: string | undefined;
  updated_at?: string | undefined;
  expires_on?: string | undefined;
}

/** DCV Delegation UUID */
export interface DCVDelegation {
  uuid: string;
}

/** SSL Recommendations */
export interface SSLRecommendation {
  id?: string | undefined;
  value?: string | undefined;
  modified_on?: string | undefined;
}

/** Post-Quantum Encryption setting */
export interface PostQuantumSetting {
  value: string;
  modified_on?: string | undefined;
}

// ─── Load Balancer Types ──────────────────────────────────────────────────

/** Load Balancer */
export interface LoadBalancer {
  id: string;
  name: string;
  description?: string | undefined;
  enabled?: boolean | undefined;
  ttl?: number | undefined;
  fallback_pool: string;
  default_pools: string[];
  proxied?: boolean | undefined;
  steering_policy?: string | undefined;
  session_affinity?: string | undefined;
  session_affinity_ttl?: number | undefined;
  session_affinity_attributes?: Record<string, unknown> | undefined;
  rules?: LoadBalancerRule[] | undefined;
  pop_pools?: Record<string, string[]> | undefined;
  country_pools?: Record<string, string[]> | undefined;
  region_pools?: Record<string, string[]> | undefined;
  created_on?: string | undefined;
  modified_on?: string | undefined;
}

/** Load Balancer Rule */
export interface LoadBalancerRule {
  name: string;
  condition?: string | undefined;
  disabled?: boolean | undefined;
  fixed_response?: {
    message_body?: string | undefined;
    status_code?: number | undefined;
    content_type?: string | undefined;
    location?: string | undefined;
  } | undefined;
  overrides?: Record<string, unknown> | undefined;
  priority?: number | undefined;
  terminates?: boolean | undefined;
}

/** Load Balancer Pool */
export interface LoadBalancerPool {
  id: string;
  name: string;
  description?: string | undefined;
  enabled: boolean;
  minimum_origins?: number | undefined;
  monitor?: string | undefined;
  origins: LoadBalancerOrigin[];
  notification_email?: string | undefined;
  notification_filter?: Record<string, unknown> | undefined;
  check_regions?: string[] | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
  load_shedding?: Record<string, unknown> | undefined;
  origin_steering?: Record<string, unknown> | undefined;
  healthy?: boolean | undefined;
  created_on?: string | undefined;
  modified_on?: string | undefined;
}

/** Load Balancer Origin */
export interface LoadBalancerOrigin {
  name: string;
  address: string;
  enabled: boolean;
  weight?: number | undefined;
  header?: Record<string, string[]> | undefined;
  virtual_network_id?: string | undefined;
}

/** Load Balancer Monitor */
export interface LoadBalancerMonitor {
  id: string;
  type: string;
  description?: string | undefined;
  method?: string | undefined;
  path?: string | undefined;
  header?: Record<string, string[]> | undefined;
  port?: number | undefined;
  timeout?: number | undefined;
  retries?: number | undefined;
  interval?: number | undefined;
  expected_body?: string | undefined;
  expected_codes?: string | undefined;
  follow_redirects?: boolean | undefined;
  allow_insecure?: boolean | undefined;
  probe_zone?: string | undefined;
  consecutive_up?: number | undefined;
  consecutive_down?: number | undefined;
  created_on?: string | undefined;
  modified_on?: string | undefined;
}

/** Load Balancer Pool Health */
export interface LoadBalancerPoolHealth {
  pool_id?: string | undefined;
  pop_health?: Record<string, unknown> | undefined;
}

/** Load Balancer Monitor Preview */
export interface LoadBalancerMonitorPreview {
  preview_id: string;
  pools?: Record<string, unknown> | undefined;
}

/** Load Balancer Region */
export interface LoadBalancerRegion {
  region_code: string;
  countries?: string[] | undefined;
}

// ─── Healthchecks Types ──────────────────────────────────────────────────

/** Healthcheck */
export interface Healthcheck {
  id: string;
  name: string;
  description?: string | undefined;
  suspended?: boolean | undefined;
  address: string;
  type?: string | undefined;
  retries?: number | undefined;
  timeout?: number | undefined;
  interval?: number | undefined;
  consecutive_successes?: number | undefined;
  consecutive_fails?: number | undefined;
  check_regions?: string[] | undefined;
  tcp_config?: {
    method?: string | undefined;
    port?: number | undefined;
  } | undefined;
  http_config?: {
    method?: string | undefined;
    port?: number | undefined;
    path?: string | undefined;
    expected_body?: string | undefined;
    expected_codes?: string[] | undefined;
    follow_redirects?: boolean | undefined;
    allow_insecure?: boolean | undefined;
    header?: Record<string, string[]> | undefined;
  } | undefined;
  status?: string | undefined;
  failure_reason?: string | undefined;
  created_on?: string | undefined;
  modified_on?: string | undefined;
}

/** Healthcheck Preview */
export interface HealthcheckPreview {
  id: string;
  name?: string | undefined;
  address?: string | undefined;
  status?: string | undefined;
}

// ─── Cache Settings Types ──────────────────────────────────────────────────

/** Cache Reserve setting */
export interface CacheReserveSetting {
  id: string;
  value: string;
  modified_on?: string | undefined;
}

/** Tiered Cache setting */
export interface TieredCacheSetting {
  id: string;
  value: string;
  modified_on?: string | undefined;
}

/** Argo Smart Routing setting */
export interface ArgoSetting {
  id: string;
  value: string;
  modified_on?: string | undefined;
}

// ─── Waiting Room Types ────────────────────────────────────────────────────

/** Waiting Room */
export interface WaitingRoom {
  id: string;
  name: string;
  description?: string | undefined;
  host: string;
  path?: string | undefined;
  queue_all?: boolean | undefined;
  disable_session_renewal?: boolean | undefined;
  suspended?: boolean | undefined;
  json_response_enabled?: boolean | undefined;
  new_users_per_minute: number;
  total_active_users: number;
  session_duration?: number | undefined;
  custom_page_html?: string | undefined;
  default_template_language?: string | undefined;
  cookie_suffix?: string | undefined;
  additional_routes?: { host: string; path?: string }[] | undefined;
  cookie_attributes?: {
    samesite?: string | undefined;
    secure?: string | undefined;
  } | undefined;
  enabled_origin_commands?: string[] | undefined;
  queueing_method?: string | undefined;
  queueing_status_code?: number | undefined;
  created_on?: string | undefined;
  modified_on?: string | undefined;
}

/** Waiting Room Event */
export interface WaitingRoomEvent {
  id: string;
  name: string;
  description?: string | undefined;
  event_start_time: string;
  event_end_time: string;
  prequeue_start_time?: string | undefined;
  shuffle_at_event_start?: boolean | undefined;
  suspended?: boolean | undefined;
  new_users_per_minute?: number | undefined;
  total_active_users?: number | undefined;
  session_duration?: number | undefined;
  disable_session_renewal?: boolean | undefined;
  custom_page_html?: string | undefined;
  queueing_method?: string | undefined;
  created_on?: string | undefined;
  modified_on?: string | undefined;
}

/** Waiting Room Rule */
export interface WaitingRoomRule {
  id?: string | undefined;
  version?: string | undefined;
  action: string;
  expression: string;
  description?: string | undefined;
  enabled?: boolean | undefined;
  last_updated?: string | undefined;
}

/** Waiting Room Status */
export interface WaitingRoomStatus {
  status: string;
  event_id?: string | undefined;
  estimated_queued_users?: number | undefined;
  estimated_total_active_users?: number | undefined;
  max_estimated_time_minutes?: number | undefined;
  created_at?: string | undefined;
}

// ─── Observatory (Speed) Types ─────────────────────────────────────────────

/** Observatory Page */
export interface ObservatoryPage {
  url: string;
  region?: string | undefined;
  schedule?: {
    frequency?: string | undefined;
    url?: string | undefined;
    region?: string | undefined;
  } | undefined;
  tests?: ObservatoryTest[] | undefined;
}

/** Observatory Test */
export interface ObservatoryTest {
  id: string;
  url: string;
  region?: string | undefined;
  date?: string | undefined;
  schedule_frequency?: string | undefined;
  mobile_report?: ObservatoryReport | undefined;
  desktop_report?: ObservatoryReport | undefined;
}

/** Observatory Report (lighthouse) */
export interface ObservatoryReport {
  state?: string | undefined;
  performance_score?: number | undefined;
  ttfb?: number | undefined;
  fcp?: number | undefined;
  lcp?: number | undefined;
  si?: number | undefined;
  tbt?: number | undefined;
  tti?: number | undefined;
  cls?: number | undefined;
}

/** Observatory Schedule */
export interface ObservatorySchedule {
  url: string;
  region?: string | undefined;
  frequency?: string | undefined;
}
