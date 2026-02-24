import type { Context, R2EventNotificationConfig, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const bucket = getStringFlag(flags, "bucket");
  if (!bucket) throw new UsageError("--bucket <name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const config = await ctx.client.get<R2EventNotificationConfig>(
    `/accounts/${encodeURIComponent(accountId)}/event_notifications/r2/${encodeURIComponent(bucket)}/configuration`,
  );

  const rules = config.rules ?? [];

  const columns: ColumnDef[] = [
    { key: "queue_id", header: "Queue ID", width: 36 },
    { key: "event_types", header: "Event Types", width: 30, transform: (v) => Array.isArray(v) ? (v as string[]).join(", ") : String(v ?? "") },
    { key: "prefix", header: "Prefix", width: 20 },
    { key: "suffix", header: "Suffix", width: 20 },
  ];

  ctx.output.table(rules as unknown as Record<string, unknown>[], columns);
}
