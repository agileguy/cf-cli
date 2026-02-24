import type { Context, PageRule, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const rules = await ctx.client.get<PageRule[]>(
    `/zones/${encodeURIComponent(zoneId)}/pagerules`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    {
      key: "targets",
      header: "Target",
      width: 40,
      transform: (v: unknown) => {
        const targets = v as PageRule["targets"];
        return targets?.[0]?.constraint?.value ?? "-";
      },
    },
    {
      key: "actions",
      header: "Actions",
      width: 30,
      transform: (v: unknown) => {
        const actions = v as PageRule["actions"];
        return actions?.map((a) => a.id).join(", ") ?? "-";
      },
    },
    { key: "status", header: "Status", width: 10 },
    { key: "priority", header: "Priority", width: 10 },
  ];

  ctx.output.table(rules, columns);
}
