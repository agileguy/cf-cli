import type { Context, R2CorsRule, ColumnDef } from "../../../types/index.js";
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

  const rules = await ctx.client.get<R2CorsRule[]>(
    `/accounts/${encodeURIComponent(accountId)}/r2/buckets/${encodeURIComponent(bucket)}/cors`,
  );

  const columns: ColumnDef[] = [
    { key: "allowed_origins", header: "Origins", width: 30, transform: (v) => Array.isArray(v) ? (v as string[]).join(", ") : String(v ?? "") },
    { key: "allowed_methods", header: "Methods", width: 25, transform: (v) => Array.isArray(v) ? (v as string[]).join(", ") : String(v ?? "") },
    { key: "allowed_headers", header: "Headers", width: 25, transform: (v) => Array.isArray(v) ? (v as string[]).join(", ") : String(v ?? "") },
    { key: "max_age_seconds", header: "Max Age", width: 10 },
  ];

  ctx.output.table(rules as unknown as Record<string, unknown>[], columns);
}
