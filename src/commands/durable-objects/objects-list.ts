import type { Context, DurableObject, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const namespaceId = getStringFlag(flags, "namespaceId");
  if (!namespaceId) throw new UsageError("--namespace-id <id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const params: Record<string, string> = {};
  const limit = getNumberFlag(flags, "limit");
  if (limit) params["limit"] = String(limit);
  const cursor = getStringFlag(flags, "cursor");
  if (cursor) params["cursor"] = cursor;

  const objects = await ctx.client.get<DurableObject[]>(
    `/accounts/${accountId}/workers/durable_objects/namespaces/${namespaceId}/objects`,
    params,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "Object ID", width: 40 },
    {
      key: "hasStoredData",
      header: "Has Stored Data",
      width: 16,
      transform: (v: unknown) => String(v),
    },
  ];

  ctx.output.table(objects as unknown as Record<string, unknown>[], columns);
}
