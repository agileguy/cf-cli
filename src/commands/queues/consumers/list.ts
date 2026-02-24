import type { Context, QueueConsumer, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const queue = getStringFlag(flags, "queue");
  if (!queue) throw new UsageError("--queue <queue-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const consumers = await ctx.client.get<QueueConsumer[]>(
    `/accounts/${encodeURIComponent(accountId)}/queues/${encodeURIComponent(queue)}/consumers`,
  );

  const columns: ColumnDef[] = [
    { key: "service", header: "Script", width: 30 },
    { key: "queue_name", header: "Queue", width: 30 },
    { key: "dead_letter_queue", header: "Dead Letter Queue", width: 20 },
    { key: "created_on", header: "Created" },
  ];

  ctx.output.table(consumers as unknown as Record<string, unknown>[], columns);
}
