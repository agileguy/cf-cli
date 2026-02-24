import type { Context, MagicSite, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.get<{ sites: MagicSite[] }>(
    `/accounts/${encodeURIComponent(accountId)}/magic/sites`,
  );

  const sites = result.sites ?? [];

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "description", header: "Description", width: 40 },
    { key: "connector_id", header: "Connector", width: 36 },
  ];

  ctx.output.table(sites as unknown as Record<string, unknown>[], columns);
}
