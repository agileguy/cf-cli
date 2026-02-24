import type { Context, FirewallIPRule, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const rules = await ctx.client.get<FirewallIPRule[]>(
    `/zones/${encodeURIComponent(zoneId)}/firewall/access_rules/rules`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "mode", header: "Mode", width: 14 },
    {
      key: "configuration",
      header: "Target",
      width: 10,
      transform: (v: unknown) => (v as { target: string }).target,
    },
    {
      key: "configuration",
      header: "Value",
      width: 24,
      transform: (v: unknown) => (v as { value: string }).value,
    },
    { key: "notes", header: "Notes", width: 24 },
    {
      key: "created_on",
      header: "Created",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "",
    },
  ];

  ctx.output.table(rules, columns);
}
