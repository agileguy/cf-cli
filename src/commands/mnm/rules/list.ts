import type { Context, MNMRule, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const rules = await ctx.client.get<MNMRule[]>(
    `/accounts/${encodeURIComponent(accountId)}/mnm/rules`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 25 },
    { key: "automatic_advertisement", header: "Auto Advertise", width: 16 },
    { key: "duration", header: "Duration", width: 12 },
    { key: "bandwidth_threshold", header: "BW Threshold", width: 14 },
  ];

  ctx.output.table(rules as unknown as Record<string, unknown>[], columns);
}
