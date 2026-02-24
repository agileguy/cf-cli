import type { Context, AIGateway } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = { name };
  const rateLimit = getNumberFlag(flags, "rateLimit");
  if (rateLimit !== undefined) body["rate_limiting_limit"] = rateLimit;

  const gw = await ctx.client.post<AIGateway>(
    `/accounts/${encodeURIComponent(accountId)}/ai-gateway/gateways`,
    body,
  );

  ctx.output.success(`AI Gateway "${name}" created (ID: ${gw.id}).`);
}
