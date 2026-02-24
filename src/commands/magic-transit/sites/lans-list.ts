import type { Context, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const site = getStringFlag(flags, "site");
  if (!site) throw new UsageError("--site <site-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.get<{ lans: Record<string, unknown>[] }>(
    `/accounts/${encodeURIComponent(accountId)}/magic/sites/${encodeURIComponent(site)}/lans`,
  );

  const lans = result.lans ?? [];

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 25 },
    { key: "physport", header: "Physical Port", width: 14 },
    { key: "vlan_tag", header: "VLAN Tag", width: 10 },
  ];

  ctx.output.table(lans, columns);
}
