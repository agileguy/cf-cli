import type { Context, AIGateway } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../utils/args.js";
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

  const body: Record<string, unknown> = {};
  const name = getStringFlag(flags, "name");
  if (name) body["name"] = name;
  const rateLimit = getNumberFlag(flags, "rateLimit");
  if (rateLimit !== undefined) body["rate_limiting_limit"] = rateLimit;

  if (Object.keys(body).length === 0) {
    throw new UsageError("At least one of --name or --rate-limit must be provided.");
  }

  const gw = await ctx.client.put<AIGateway>(
    `/accounts/${encodeURIComponent(accountId)}/ai-gateway/gateways/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`AI Gateway "${gw.name}" updated.`);
}
