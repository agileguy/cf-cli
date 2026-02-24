/**
 * Resolve the rulesets API base path for zone or account scope.
 */

import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export interface ScopeResult {
  basePath: string;
  flags: Record<string, string | boolean>;
}

/**
 * Resolve scope from --zone or --account-id flags.
 * Returns the basePath (e.g., /zones/:id/rulesets or /accounts/:id/rulesets)
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
    basePath = `/zones/${encodeURIComponent(zoneId)}/rulesets`;
  } else {
    basePath = `/accounts/${encodeURIComponent(accountId!)}/rulesets`;
  }

  return { basePath, flags };
}
