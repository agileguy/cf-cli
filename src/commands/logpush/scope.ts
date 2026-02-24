import type { Context } from "../../types/index.js";
import type { ParsedArgs } from "../../utils/args.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

/**
 * Resolve logpush scope. Logpush supports zone OR account scope.
 * --zone takes priority; if absent, --account-id is used.
 * Throws if neither is provided.
 */
export async function resolveLogpushScope(
  args: string[],
  ctx: Context,
): Promise<{ basePath: string; flags: ParsedArgs["flags"] }> {
  const { flags } = parseArgs(args);
  const zone = getStringFlag(flags, "zone");
  const accountId = getStringFlag(flags, "accountId");

  if (zone) {
    const zoneId = await resolveZoneId(zone, ctx.client);
    return { basePath: `/zones/${encodeURIComponent(zoneId)}/logpush`, flags };
  }

  if (accountId) {
    return { basePath: `/accounts/${encodeURIComponent(accountId)}/logpush`, flags };
  }

  // Try account auto-resolve
  try {
    const resolved = await resolveAccountId(undefined, ctx.client, ctx.config);
    return { basePath: `/accounts/${encodeURIComponent(resolved)}/logpush`, flags };
  } catch {
    throw new UsageError("--zone <zone> or --account-id <id> is required.");
  }
}
