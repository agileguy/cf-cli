import type { Context, AccountSubscription } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <subscription-id> is required.");

  const sub = await ctx.client.get<AccountSubscription>(
    `/accounts/${encodeURIComponent(accountId)}/subscriptions/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": sub.id,
    "Plan": sub.rate_plan?.public_name ?? sub.rate_plan?.id ?? "-",
    "Price": sub.price ?? "-",
    "Currency": sub.currency ?? "-",
    "Frequency": sub.frequency ?? "-",
    "State": sub.state ?? "-",
    "Period Start": sub.current_period_start ?? "-",
    "Period End": sub.current_period_end ?? "-",
    "Created": sub.created_on ?? "-",
  });
}
