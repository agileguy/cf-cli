import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const queue = getStringFlag(flags, "queue");
  if (!queue) throw new UsageError("--queue <queue-id> is required.");

  const consumer = getStringFlag(flags, "consumer");
  if (!consumer) throw new UsageError("--consumer <consumer-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const confirmed = await confirm(
    `Delete consumer "${consumer}" from queue "${queue}"?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `/accounts/${encodeURIComponent(accountId)}/queues/${encodeURIComponent(queue)}/consumers/${encodeURIComponent(consumer)}`,
  );

  ctx.output.success(`Consumer "${consumer}" removed from queue "${queue}".`);
}
