import { UsageError } from "./errors.js";

/** Valid DNS record types */
const VALID_RECORD_TYPES = [
  "A",
  "AAAA",
  "CAA",
  "CERT",
  "CNAME",
  "DNSKEY",
  "DS",
  "HTTPS",
  "LOC",
  "MX",
  "NAPTR",
  "NS",
  "PTR",
  "SMIMEA",
  "SRV",
  "SSHFP",
  "SVCB",
  "TLSA",
  "TXT",
  "URI",
] as const;

/** Validate a 32-character hex ID (zone_id, record_id, account_id, etc.) */
export function validateId(value: string, label: string): string {
  const trimmed = value.trim();
  if (!/^[a-f0-9]{32}$/i.test(trimmed)) {
    throw new UsageError(
      `Invalid ${label}: "${trimmed}". Must be a 32-character hex string.`,
    );
  }
  return trimmed.toLowerCase();
}

/** Validate a domain name */
export function validateDomain(value: string): string {
  const trimmed = value.trim().toLowerCase();
  // Basic domain validation: alphanumeric + hyphens + dots
  if (
    !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i.test(
      trimmed,
    )
  ) {
    throw new UsageError(
      `Invalid domain: "${trimmed}". Must be a valid domain name.`,
    );
  }
  return trimmed;
}

/** Validate a DNS record type */
export function validateRecordType(value: string): string {
  const upper = value.trim().toUpperCase();
  if (!VALID_RECORD_TYPES.includes(upper as (typeof VALID_RECORD_TYPES)[number])) {
    throw new UsageError(
      `Invalid record type: "${value}". Valid types: ${VALID_RECORD_TYPES.join(", ")}`,
    );
  }
  return upper;
}

/** Validate TTL value (1 = auto, or 60-86400) */
export function validateTTL(value: string | number): number {
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  if (isNaN(num)) {
    throw new UsageError(`Invalid TTL: "${value}". Must be a number.`);
  }
  if (num === 1) return 1; // auto
  if (num < 60 || num > 86400) {
    throw new UsageError(
      `Invalid TTL: ${num}. Must be 1 (auto) or between 60-86400.`,
    );
  }
  return num;
}

/** Validate an IP address (IPv4 or IPv6) */
export function validateIP(value: string): string {
  const trimmed = value.trim();
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) {
    const parts = trimmed.split(".").map(Number);
    if (parts.every((p) => p >= 0 && p <= 255)) return trimmed;
  }
  // IPv6 (simplified check)
  if (/^[a-f0-9:]+$/i.test(trimmed) && trimmed.includes(":")) {
    return trimmed;
  }
  throw new UsageError(
    `Invalid IP address: "${trimmed}". Must be a valid IPv4 or IPv6 address.`,
  );
}

/** Validate MX priority */
export function validatePriority(value: string | number): number {
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  if (isNaN(num) || num < 0 || num > 65535) {
    throw new UsageError(
      `Invalid priority: "${value}". Must be between 0-65535.`,
    );
  }
  return num;
}

/** Validate output format */
export function validateOutputFormat(
  value: string,
): "table" | "json" | "csv" | "yaml" {
  const lower = value.trim().toLowerCase();
  if (!["table", "json", "csv", "yaml"].includes(lower)) {
    throw new UsageError(
      `Invalid output format: "${value}". Valid formats: table, json, csv, yaml`,
    );
  }
  return lower as "table" | "json" | "csv" | "yaml";
}

/** Parse a key=value pair from CLI args */
export function parseKeyValue(arg: string): [string, string] {
  const idx = arg.indexOf("=");
  if (idx === -1) {
    throw new UsageError(
      `Invalid argument: "${arg}". Expected format: key=value`,
    );
  }
  return [arg.substring(0, idx), arg.substring(idx + 1)];
}

/** Require a named argument and throw if missing */
export function requireArg(
  args: string[],
  index: number,
  label: string,
): string {
  const value = args[index];
  if (value === undefined || value.startsWith("-")) {
    throw new UsageError(`Missing required argument: <${label}>`);
  }
  return value;
}
