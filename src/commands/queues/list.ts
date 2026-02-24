import type { Context, Queue, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const queues = await ctx.client.get<Queue[]>(
    `/accounts/${encodeURIComponent(accountId)}/queues`,
  );

  const columns: ColumnDef[] = [
    { key: "queue_id", header: "ID", width: 36 },
    { key: "queue_name", header: "Name", width: 30 },
    { key: "producers_total_count", header: "Producers" },
    { key: "consumers_total_count", header: "Consumers" },
    { key: "created_on", header: "Created" },
  ];

  ctx.output.table(queues as unknown as Record<string, unknown>[], columns);
}
