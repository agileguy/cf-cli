/**
 * Resolve the Gateway API base path (account scope only).
 */

import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export interface ScopeResult {
  basePath: string;
  accountId: string;
  flags: Record<string, string | boolean>;
}

/**
 * Resolve account scope for gateway commands.
 * Returns the basePath (e.g., /accounts/:id/gateway)
 * and the parsed flags.
 */
export async function resolveGatewayScope(
  args: string[],
  ctx: Context,
): Promise<ScopeResult> {
  const { flags } = parseArgs(args);

  const accountIdFlag = getStringFlag(flags, "accountId");
  const accountId = await resolveAccountId(accountIdFlag, ctx.client, ctx.config);
  const basePath = `/accounts/${encodeURIComponent(accountId)}/gateway`;

  return { basePath, accountId, flags };
}
