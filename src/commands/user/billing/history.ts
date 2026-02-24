import type { Context, BillingHistoryEntry, ColumnDef } from "../../../types/index.js";
import { parseArgs, getNumberFlag } from "../../../utils/args.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const page = getNumberFlag(flags, "page");
  const perPage = getNumberFlag(flags, "perPage");

  const params: Record<string, string> = {};
  if (page) params["page"] = String(page);
  if (perPage) params["per_page"] = String(perPage);

  const entries = await ctx.client.get<BillingHistoryEntry[]>(
    "/user/billing/history",
    params,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "type", header: "Type", width: 14 },
    { key: "action", header: "Action", width: 14 },
    { key: "description", header: "Description", width: 30 },
    { key: "amount", header: "Amount", width: 10 },
    { key: "currency", header: "Currency", width: 10 },
    {
      key: "occurred_at",
      header: "Date",
      width: 12,
      transform: (v: unknown) => (typeof v === "string" ? v.slice(0, 10) : "-"),
    },
  ];

  ctx.output.table(entries, columns);
}
