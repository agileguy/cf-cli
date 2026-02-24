import type { Context, HyperdriveConfig, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const configs = await ctx.client.get<HyperdriveConfig[]>(
    `/accounts/${encodeURIComponent(accountId)}/hyperdrive/configs`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "origin.host", header: "Host", width: 30 },
    { key: "origin.database", header: "Database", width: 20 },
  ];

  ctx.output.table(configs as unknown as Record<string, unknown>[], columns);
}
