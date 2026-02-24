import type { Context, RegionalHostname, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const hostnames = await ctx.client.get<RegionalHostname[]>(
    `/zones/${encodeURIComponent(zoneId)}/addressing/regional_hostnames`,
  );

  const columns: ColumnDef[] = [
    { key: "hostname", header: "Hostname", width: 40 },
    { key: "region_key", header: "Region", width: 16 },
    { key: "created_on", header: "Created", width: 24 },
    { key: "modified_on", header: "Modified", width: 24 },
  ];

  ctx.output.table(hostnames as unknown as Record<string, unknown>[], columns);
}
