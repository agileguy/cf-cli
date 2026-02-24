import type { Context, KVNamespace, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const namespaces = await ctx.client.get<KVNamespace[]>(
    `/accounts/${accountId}/storage/kv/namespaces`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "title", header: "Title", width: 30 },
  ];

  ctx.output.table(namespaces as unknown as Record<string, unknown>[], columns);
}
