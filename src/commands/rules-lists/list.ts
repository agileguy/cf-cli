import type { Context, RulesList, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const lists = await ctx.client.get<RulesList[]>(
    `/accounts/${encodeURIComponent(accountId)}/rules/lists`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "kind", header: "Kind", width: 12 },
    { key: "num_items", header: "Items", width: 8 },
    { key: "created_on", header: "Created", width: 12, transform: (v: unknown) => String(v).slice(0, 10) },
  ];

  ctx.output.table(lists, columns);
}
