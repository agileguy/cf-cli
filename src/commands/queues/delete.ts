import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { confirm } from "../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const queue = getStringFlag(flags, "queue");
  if (!queue) throw new UsageError("--queue <queue-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const confirmed = await confirm(
    `Delete queue "${queue}"? This will permanently remove the queue and all its messages.`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `/accounts/${encodeURIComponent(accountId)}/queues/${encodeURIComponent(queue)}`,
  );

  ctx.output.success(`Queue "${queue}" deleted.`);
}
