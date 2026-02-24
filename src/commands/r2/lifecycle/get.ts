import type { Context, R2LifecycleRule, ColumnDef } from "../../../types/index.js";
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

  const rules = await ctx.client.get<R2LifecycleRule[]>(
    `/accounts/${encodeURIComponent(accountId)}/r2/buckets/${encodeURIComponent(bucket)}/lifecycle`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 20 },
    { key: "enabled", header: "Enabled", width: 10 },
    { key: "action.type", header: "Action", width: 20 },
    { key: "conditions.prefix", header: "Prefix", width: 20 },
    { key: "conditions.max_age_days", header: "Max Age (days)", width: 15 },
  ];

  ctx.output.table(rules as unknown as Record<string, unknown>[], columns);
}
