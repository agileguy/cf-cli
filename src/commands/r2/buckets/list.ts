import type { Context, R2Bucket, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const params: Record<string, string> = {};
  const cursor = getStringFlag(flags, "cursor");
  if (cursor) params["cursor"] = cursor;

  const buckets = await ctx.client.get<R2Bucket[]>(
    `/accounts/${encodeURIComponent(accountId)}/r2/buckets`,
    params,
  );

  const columns: ColumnDef[] = [
    { key: "name", header: "Name", width: 40 },
    { key: "location", header: "Location", width: 15 },
    { key: "storage_class", header: "Storage Class", width: 15 },
    { key: "creation_date", header: "Created", width: 25 },
  ];

  ctx.output.table(buckets as unknown as Record<string, unknown>[], columns);
}
