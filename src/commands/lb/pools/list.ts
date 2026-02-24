import type { Context, LoadBalancerPool, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const pools = await ctx.client.get<LoadBalancerPool[]>(
    `/accounts/${encodeURIComponent(accountId)}/load_balancers/pools`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 24 },
    { key: "enabled", header: "Enabled", width: 8, transform: (v: unknown) => (v as boolean) ? "Yes" : "No" },
    { key: "healthy", header: "Healthy", width: 8, transform: (v: unknown) => v === true ? "Yes" : v === false ? "No" : "?" },
    { key: "origins", header: "Origins", width: 8, transform: (v: unknown) => Array.isArray(v) ? String(v.length) : "0" },
  ];

  ctx.output.table(pools as unknown as Record<string, unknown>[], columns);
}
