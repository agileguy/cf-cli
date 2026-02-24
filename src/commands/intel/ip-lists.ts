import type { Context, IntelIPList, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.get<IntelIPList[]>(
    `/accounts/${encodeURIComponent(accountId)}/intel/ip-list`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 8 },
    { key: "name", header: "Name", width: 30 },
    { key: "description", header: "Description", width: 40 },
  ];

  ctx.output.table(result, columns);
}
