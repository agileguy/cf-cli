import type { Context, QueueConsumer } from "../../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const queue = getStringFlag(flags, "queue");
  if (!queue) throw new UsageError("--queue <queue-id> is required.");

  const script = getStringFlag(flags, "script");
  if (!script) throw new UsageError("--script <worker-name> is required.");

  const batchSize = getNumberFlag(flags, "batchSize");
  const maxRetries = getNumberFlag(flags, "maxRetries");
  const deadLetter = getStringFlag(flags, "deadLetter");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = {
    script_name: script,
    type: "worker",
  };

  const settings: Record<string, unknown> = {};
  if (batchSize !== undefined) settings["batch_size"] = batchSize;
  if (maxRetries !== undefined) settings["max_retries"] = maxRetries;

  if (Object.keys(settings).length > 0) {
    body["settings"] = settings;
  }

  if (deadLetter) {
    body["dead_letter_queue"] = deadLetter;
  }

  const result = await ctx.client.post<QueueConsumer>(
    `/accounts/${encodeURIComponent(accountId)}/queues/${encodeURIComponent(queue)}/consumers`,
    body,
  );

  ctx.output.success(`Consumer "${result.service}" added to queue "${queue}".`);
}
