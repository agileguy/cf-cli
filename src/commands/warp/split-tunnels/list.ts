import type { Context, SplitTunnelEntry, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const entries = await ctx.client.get<SplitTunnelEntry[]>(
    `/accounts/${encodeURIComponent(accountId)}/devices/policy/exclude`,
  );

  const columns: ColumnDef[] = [
    { key: "address", header: "Address", width: 24 },
    { key: "description", header: "Description", width: 40 },
    { key: "host", header: "Host" },
  ];

  ctx.output.table(entries as unknown as Record<string, unknown>[], columns);
}
