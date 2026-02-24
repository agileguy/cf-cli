/**
 * Resolve a zone reference (ID or domain name) to a zone ID.
 *
 * If the input looks like a 32-character hex string, it's treated as an ID.
 * Otherwise, it's treated as a zone name and looked up via the API.
 */

import type { CloudflareClient } from "../types/common.js";
import type { Zone } from "../types/api.js";
import { UsageError } from "./errors.js";

const HEX_ID_PATTERN = /^[a-f0-9]{32}$/i;

export async function resolveZoneId(
  zoneRef: string,
  client: CloudflareClient,
): Promise<string> {
  const trimmed = zoneRef.trim();

  if (!trimmed) {
    throw new UsageError("Zone reference cannot be empty.");
  }

  // If it looks like a hex ID, use directly
  if (HEX_ID_PATTERN.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  // Otherwise, look up by zone name
  // client.get already unwraps the CloudflareResponse envelope
  const zones = await client.get<Zone[]>("/zones", { name: trimmed });

  if (!Array.isArray(zones) || zones.length === 0) {
    throw new UsageError(
      `Zone not found: "${trimmed}". Use a valid zone ID or domain name.`,
    );
  }

  return zones[0]!.id;
}
