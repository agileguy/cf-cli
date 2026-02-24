import type { Context, Queue } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <queue-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.post<Queue>(
    `/accounts/${encodeURIComponent(accountId)}/queues`,
    { queue_name: name },
  );

  ctx.output.success(`Queue "${result.queue_name}" created (ID: ${result.queue_id}).`);
}
