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
    `Purge all messages from queue "${queue}"? This cannot be undone.`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.post<void>(
    `/accounts/${encodeURIComponent(accountId)}/queues/${encodeURIComponent(queue)}/purge`,
  );

  ctx.output.success(`Queue "${queue}" purged.`);
}
