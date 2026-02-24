import type { Context, MagicRoute, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.get<{ routes: MagicRoute[] }>(
    `/accounts/${encodeURIComponent(accountId)}/magic/routes`,
  );

  const routes = result.routes ?? [];

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "prefix", header: "Prefix", width: 20 },
    { key: "nexthop", header: "Next Hop", width: 18 },
    { key: "priority", header: "Priority", width: 10 },
    { key: "description", header: "Description", width: 30 },
  ];

  ctx.output.table(routes as unknown as Record<string, unknown>[], columns);
}
