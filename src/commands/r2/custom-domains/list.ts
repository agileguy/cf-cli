import type { Context, R2CustomDomain, ColumnDef } from "../../../types/index.js";
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

  const domains = await ctx.client.get<R2CustomDomain[]>(
    `/accounts/${encodeURIComponent(accountId)}/r2/buckets/${encodeURIComponent(bucket)}/custom_domains`,
  );

  const columns: ColumnDef[] = [
    { key: "domain", header: "Domain", width: 40 },
    { key: "status", header: "Status", width: 15 },
    { key: "enabled", header: "Enabled", width: 10 },
    { key: "zone_name", header: "Zone", width: 25 },
  ];

  ctx.output.table(domains as unknown as Record<string, unknown>[], columns);
}
