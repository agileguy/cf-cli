import type { Context, Queue } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const queue = getStringFlag(flags, "queue");
  if (!queue) throw new UsageError("--queue <name-or-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.get<Queue>(
    `/accounts/${encodeURIComponent(accountId)}/queues/${encodeURIComponent(queue)}`,
  );

  ctx.output.detail({
    "ID": result.queue_id,
    "Name": result.queue_name,
    "Producers": result.producers_total_count,
    "Consumers": result.consumers_total_count,
    "Created": result.created_on,
    "Modified": result.modified_on,
  });
}
