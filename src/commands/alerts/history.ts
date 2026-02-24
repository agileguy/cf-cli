import type { Context, AlertHistoryEntry, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const params: Record<string, string> = {};
  const from = getStringFlag(flags, "from");
  const to = getStringFlag(flags, "to");
  if (from) params["since"] = from;
  if (to) params["until"] = to;

  const entries = await ctx.client.get<AlertHistoryEntry[]>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/history`,
    params,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "alert_type", header: "Type", width: 30 },
    { key: "mechanism_type", header: "Mechanism", width: 15 },
    { key: "sent", header: "Sent", width: 20 },
  ];

  ctx.output.table(entries, columns);
}
