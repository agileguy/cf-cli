import type { Context, BGPPrefix, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const prefixId = getStringFlag(flags, "prefix");
  if (!prefixId) throw new UsageError("--prefix <prefix-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const bgpPrefixes = await ctx.client.get<BGPPrefix[]>(
    `/accounts/${encodeURIComponent(accountId)}/addressing/prefixes/${encodeURIComponent(prefixId)}/bgp/prefixes`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "cidr", header: "CIDR", width: 20 },
    { key: "created_at", header: "Created", width: 24 },
    { key: "modified_at", header: "Modified", width: 24 },
  ];

  ctx.output.table(bgpPrefixes as unknown as Record<string, unknown>[], columns);
}
