/**
 * Resolve an account ID from flags, config profile, or API.
 *
 * Priority:
 *   1. --account-id flag (explicit)
 *   2. Config profile's account_id
 *   3. Auto-detect by listing accounts (if exactly one)
 */

import type { CloudflareClient, Config } from "../types/index.js";
import type { Account } from "../types/api.js";
import { UsageError } from "./errors.js";

export async function resolveAccountId(
  flagValue: string | undefined,
  client: CloudflareClient,
  config?: Config,
): Promise<string> {
  // 1. Explicit flag
  if (flagValue) {
    return flagValue;
  }

  // 2. Config profile
  const profileName = config?.default_profile ?? "default";
  const profile = config?.profiles[profileName];
  if (profile?.account_id) {
    return profile.account_id;
  }

  // 3. Auto-detect from API
  const accounts = await client.get<Account[]>("/accounts");
  if (!Array.isArray(accounts) || accounts.length === 0) {
    throw new UsageError(
      "No accounts found. Provide --account-id explicitly.",
    );
  }
  if (accounts.length > 1) {
    throw new UsageError(
      `Multiple accounts found. Provide --account-id explicitly.\nAccounts: ${accounts.map((a) => `${a.id} (${a.name})`).join(", ")}`,
    );
  }
  return accounts[0]!.id;
}
