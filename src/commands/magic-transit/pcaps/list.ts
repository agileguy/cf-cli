import type { Context, MagicPCAP, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const pcaps = await ctx.client.get<MagicPCAP[]>(
    `/accounts/${encodeURIComponent(accountId)}/magic/pcaps`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "type", header: "Type", width: 10 },
    { key: "system", header: "System", width: 12 },
    { key: "status", header: "Status", width: 12 },
    { key: "colo_name", header: "Colo", width: 8 },
  ];

  ctx.output.table(pcaps as unknown as Record<string, unknown>[], columns);
}
