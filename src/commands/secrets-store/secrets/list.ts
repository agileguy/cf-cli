import type { Context, SecretsStoreSecret, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const store = getStringFlag(flags, "store");
  if (!store) throw new UsageError("--store <store-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const secrets = await ctx.client.get<SecretsStoreSecret[]>(
    `/accounts/${encodeURIComponent(accountId)}/secrets_store/stores/${encodeURIComponent(store)}/secrets`,
  );

  const columns: ColumnDef[] = [
    { key: "name", header: "Name", width: 30 },
    { key: "status", header: "Status", width: 12 },
    { key: "comment", header: "Comment", width: 30 },
    { key: "created_on", header: "Created" },
  ];

  ctx.output.table(secrets as unknown as Record<string, unknown>[], columns);
}
