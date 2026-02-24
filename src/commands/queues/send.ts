import type { Context, QueueMessageSendResult } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const queue = getStringFlag(flags, "queue");
  if (!queue) throw new UsageError("--queue <queue-id> is required.");

  const body = getStringFlag(flags, "body");
  if (!body) throw new UsageError("--body <text> is required.");

  const delay = getNumberFlag(flags, "delay");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const payload: Record<string, unknown> = {
    body,
  };

  if (delay !== undefined) {
    payload["delay_seconds"] = delay;
  }

  const result = await ctx.client.post<QueueMessageSendResult>(
    `/accounts/${encodeURIComponent(accountId)}/queues/${encodeURIComponent(queue)}/messages`,
    payload,
  );

  ctx.output.success(`Message sent to queue "${queue}" (ID: ${result.message_id}).`);
}
