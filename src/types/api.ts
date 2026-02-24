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
