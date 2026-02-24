import type { Context, KVKey, ColumnDef } from "../../types/index.js";
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
  const prefix = getStringFlag(flags, "prefix");
  if (prefix) params["prefix"] = prefix;
  const limit = getNumberFlag(flags, "limit");
  if (limit) params["limit"] = String(limit);
  const cursor = getStringFlag(flags, "cursor");
  if (cursor) params["cursor"] = cursor;

  const keys = await ctx.client.get<KVKey[]>(
    `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys`,
    params,
  );

  const columns: ColumnDef[] = [
    { key: "name", header: "Key Name", width: 40 },
    {
      key: "expiration",
      header: "Expiration",
      width: 14,
      transform: (v: unknown) => v ? new Date((v as number) * 1000).toISOString().slice(0, 10) : "-",
    },
    {
      key: "metadata",
      header: "Metadata",
      width: 30,
      transform: (v: unknown) => v ? JSON.stringify(v) : "-",
    },
  ];

  ctx.output.table(keys as unknown as Record<string, unknown>[], columns);
}
