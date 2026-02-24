import type { Context, AlertAvailable, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.get<Record<string, AlertAvailable[]>>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/available_alerts`,
  );

  // The API returns a map of category -> alert types; flatten into a list
  const alerts: AlertAvailable[] = [];
  for (const category of Object.values(result)) {
    if (Array.isArray(category)) {
      alerts.push(...category);
    }
  }

  const columns: ColumnDef[] = [
    { key: "type", header: "Type", width: 40 },
    { key: "display_name", header: "Display Name", width: 40 },
    { key: "description", header: "Description", width: 50 },
  ];

  ctx.output.table(alerts, columns);
}
