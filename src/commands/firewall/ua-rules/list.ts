import type { Context, FirewallUARule, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const rules = await ctx.client.get<FirewallUARule[]>(
    `/zones/${encodeURIComponent(zoneId)}/firewall/ua_rules`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "mode", header: "Mode", width: 14 },
    {
      key: "configuration",
      header: "UA Pattern",
      width: 40,
      transform: (v: unknown) => (v as { value: string }).value,
    },
    { key: "description", header: "Description", width: 24 },
    {
      key: "paused",
      header: "Paused",
      width: 8,
      transform: (v: unknown) => (v as boolean) ? "Yes" : "No",
    },
  ];

  ctx.output.table(rules, columns);
}
