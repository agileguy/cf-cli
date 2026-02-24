/**
 * Resolve the Access API base path for zone or account scope.
 */

import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export interface ScopeResult {
  basePath: string;
  accountId?: string;
  flags: Record<string, string | boolean>;
}

/**
 * Resolve scope from --zone or --account-id flags.
 * Returns the basePath (e.g., /zones/:id/access or /accounts/:id/access)
 * and the parsed flags.
 */
export async function resolveScope(
  args: string[],
  ctx: Context,
): Promise<ScopeResult> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const accountId = getStringFlag(flags, "accountId");

  if (zone && accountId) {
    throw new UsageError("Specify either --zone or --account-id, not both.");
  }

  if (!zone && !accountId) {
    throw new UsageError("--zone <zone> or --account-id <id> is required.");
  }

  let basePath: string;
  if (zone) {
    const zoneId = await resolveZoneId(zone, ctx.client);
    basePath = `/zones/${encodeURIComponent(zoneId)}/access`;
    return { basePath, flags };
  } else {
    const resolvedAccountId = accountId!;
    basePath = `/accounts/${encodeURIComponent(resolvedAccountId)}/access`;
    return { basePath, accountId: resolvedAccountId, flags };
  }
}

/**
 * Resolve scope requiring --account-id only (no zone support).
 */
export async function resolveAccountScope(
  args: string[],
  ctx: Context,
): Promise<ScopeResult> {
  const { flags } = parseArgs(args);

  const accountId = getStringFlag(flags, "accountId");
  if (!accountId) {
    const resolved = await import("../../utils/account-resolver.js").then(
      (m) => m.resolveAccountId(undefined, ctx.client, ctx.config),
    );
    const basePath = `/accounts/${encodeURIComponent(resolved)}/access`;
    return { basePath, accountId: resolved, flags };
  }

  const basePath = `/accounts/${encodeURIComponent(accountId)}/access`;
  return { basePath, accountId, flags };
}
