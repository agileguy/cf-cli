import type { Context, AlertPolicy, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const policies = await ctx.client.get<AlertPolicy[]>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/policies`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "alert_type", header: "Type", width: 30 },
    { key: "enabled", header: "Enabled", width: 10 },
  ];

  ctx.output.table(policies, columns);
}
