import type { Context, Account, ColumnDef } from "../../types/index.js";
import { parseArgs, getNumberFlag, getBoolFlag } from "../../utils/args.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const page = getNumberFlag(flags, "page");
  const perPage = getNumberFlag(flags, "perPage");
  const all = getBoolFlag(flags, "all");

  const params: Record<string, string> = {};
  if (page) params["page"] = String(page);
  if (perPage) params["per_page"] = String(perPage);

  let accounts: Account[];

  if (all) {
    accounts = await ctx.client.fetchAll<Account>("/accounts", params);
  } else {
    accounts = await ctx.client.get<Account[]>("/accounts", params);
  }

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "name", header: "Name", width: 40 },
    { key: "type", header: "Type", width: 12 },
    {
      key: "created_on",
      header: "Created",
      width: 12,
      transform: (v: unknown) => String(v).slice(0, 10),
    },
  ];

  ctx.output.table(accounts, columns);
}
