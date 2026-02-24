import type { Context, EmailRoutingRule, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const rules = await ctx.client.get<EmailRoutingRule[]>(
    `/zones/${encodeURIComponent(zoneId)}/email/routing/rules`,
  );

  const columns: ColumnDef[] = [
    { key: "tag", header: "Tag", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "enabled", header: "Enabled", width: 10 },
    { key: "priority", header: "Priority", width: 10 },
  ];

  ctx.output.table(rules, columns);
}
