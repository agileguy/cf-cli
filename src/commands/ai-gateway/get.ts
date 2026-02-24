import type { Context, AIGateway } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <gateway-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const gw = await ctx.client.get<AIGateway>(
    `/accounts/${encodeURIComponent(accountId)}/ai-gateway/gateways/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": gw.id,
    "Name": gw.name,
    "Slug": gw.slug ?? "-",
    "Rate Limit": gw.rate_limiting_limit ?? "-",
    "Rate Limit Interval": gw.rate_limiting_interval ?? "-",
    "Rate Limit Technique": gw.rate_limiting_technique ?? "-",
    "Created": gw.created_at ?? "-",
    "Modified": gw.modified_at ?? "-",
  });
}
