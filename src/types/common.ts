import type { Config } from "./config.js";

export type { Config };

export interface CloudflareResponse<T> {
  success: boolean;
  errors: CloudflareError[];
  messages: CloudflareMessage[];
  result: T;
  result_info?: ResultInfo;
}

export interface CloudflareError {
  code: number;
  message: string;
}

export interface CloudflareMessage {
  code: number;
  message: string;
}

export interface ResultInfo {
  page: number;
  per_page: number;
  total_pages: number;
  count: number;
  total_count: number;
  cursors?: { before?: string; after?: string };
}

export interface GlobalFlags {
  profile?: string | undefined;
  output?: "table" | "json" | "csv" | "yaml" | undefined;
  raw?: boolean | undefined;
  verbose?: boolean | undefined;
  quiet?: boolean | undefined;
  noColor?: boolean | undefined;
  yes?: boolean | undefined;
}

export interface Context {
  client: CloudflareClient;
  output: OutputFormatter;
  flags: GlobalFlags;
  config: Config;
}

// Forward references
export interface CloudflareClient {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string, body?: unknown): Promise<T>;
  fetchAll<T>(path: string, params?: Record<string, string>): Promise<T[]>;
  upload(path: string, formData: FormData): Promise<unknown>;
  uploadPut<T>(path: string, formData: FormData): Promise<T>;
}

export interface OutputFormatter {
  table(data: unknown[], columns: ColumnDef[]): void;
  json(data: unknown): void;
  csv(data: unknown[], columns: ColumnDef[]): void;
  yaml(data: unknown): void;
  raw(data: unknown): void;
  success(message: string): void;
  error(message: string): void;
  warn(message: string): void;
  info(message: string): void;
  detail(data: Record<string, unknown>): void;
}

export interface ColumnDef {
  key: string;
  header: string;
  width?: number | undefined;
  color?: ((value: unknown) => string) | undefined;
  transform?: ((value: unknown) => string) | undefined;
}

export interface CommandHandler {
  run(args: string[], ctx: Context): Promise<void>;
}

