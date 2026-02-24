export interface Config {
  version: number;
  default_profile: string;
  profiles: Record<string, Profile>;
  defaults: Defaults;
}

export interface Profile {
  auth_method: "token" | "key";
  token?: string | undefined;
  api_key?: string | undefined;
  email?: string | undefined;
  account_id?: string | undefined;
  zone_id?: string | undefined;
}

export interface Defaults {
  output: "table" | "json" | "csv" | "yaml";
  no_color: boolean;
  per_page: number;
}
