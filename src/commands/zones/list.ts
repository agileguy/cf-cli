import type { Context, Zone, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag, getBoolFlag } from "../../utils/args.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = getStringFlag(flags, "accountId");
  const name = getStringFlag(flags, "name");
  const status = getStringFlag(flags, "status");
  const page = getNumberFlag(flags, "page");
  const perPage = getNumberFlag(flags, "perPage");
  const all = getBoolFlag(flags, "all");

  const params: Record<string, string> = {};
  if (accountId) params["account.id"] = accountId;
  if (name) params["name"] = name;
  if (status) params["status"] = status;
  if (page) params["page"] = String(page);
  if (perPage) params["per_page"] = String(perPage);

  let zones: Zone[];

  if (all) {
    zones = await ctx.client.fetchAll<Zone>("/zones", params);
  } else {
    zones = await ctx.client.get<Zone[]>("/zones", params);
  }

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "name", header: "Name", width: 30 },
    { key: "status", header: "Status", width: 12 },
    {
      key: "name_servers",
      header: "NS",
      width: 6,
      transform: (v: unknown) => String((v as string[]).length),
    },
    {
      key: "created_on",
      header: "Created",
      width: 12,
      transform: (v: unknown) => String(v).slice(0, 10),
    },
    {
      key: "plan",
      header: "Plan",
      width: 12,
      transform: (v: unknown) => (v as { name: string }).name,
    },
  ];

  ctx.output.table(zones, columns);
}
