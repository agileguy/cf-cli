import type { Context, SecretsStore, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const stores = await ctx.client.get<SecretsStore[]>(
    `/accounts/${encodeURIComponent(accountId)}/secrets_store/stores`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "status", header: "Status", width: 12 },
    { key: "created_on", header: "Created" },
  ];

  ctx.output.table(stores as unknown as Record<string, unknown>[], columns);
}
