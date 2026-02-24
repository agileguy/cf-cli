import type { Context, PageShieldPolicy, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const policies = await ctx.client.get<PageShieldPolicy[]>(
    `/zones/${encodeURIComponent(zoneId)}/page_shield/policies`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "action", header: "Action", width: 14 },
    { key: "value", header: "Value", width: 40 },
    { key: "description", header: "Description", width: 24 },
    {
      key: "enabled",
      header: "Enabled",
      width: 8,
      transform: (v: unknown) => v === false ? "No" : "Yes",
    },
  ];

  ctx.output.table(policies, columns);
}
