import type { Context, LoadBalancerMonitor, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const monitors = await ctx.client.get<LoadBalancerMonitor[]>(
    `/accounts/${encodeURIComponent(accountId)}/load_balancers/monitors`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "type", header: "Type", width: 8 },
    { key: "description", header: "Description", width: 30 },
    { key: "path", header: "Path", width: 20 },
    { key: "interval", header: "Interval", width: 10 },
  ];

  ctx.output.table(monitors as unknown as Record<string, unknown>[], columns);
}
