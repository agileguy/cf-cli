import type { Context, Queue } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const queue = getStringFlag(flags, "queue");
  if (!queue) throw new UsageError("--queue <queue-id> is required.");

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <new-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.put<Queue>(
    `/accounts/${encodeURIComponent(accountId)}/queues/${encodeURIComponent(queue)}`,
    { queue_name: name },
  );

  ctx.output.success(`Queue "${result.queue_name}" updated.`);
}
