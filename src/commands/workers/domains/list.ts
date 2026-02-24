import type { Context, WorkerDomain, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const domains = await ctx.client.get<WorkerDomain[]>(
    `/accounts/${accountId}/workers/domains`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "hostname", header: "Hostname", width: 30 },
    { key: "service", header: "Service", width: 20 },
    { key: "environment", header: "Environment", width: 14 },
    { key: "zone_name", header: "Zone", width: 20 },
  ];

  ctx.output.table(domains as unknown as Record<string, unknown>[], columns);
}
