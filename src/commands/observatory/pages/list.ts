import type { Context, ObservatoryPage, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const pages = await ctx.client.get<ObservatoryPage[]>(
    `/zones/${encodeURIComponent(zoneId)}/speed_api/pages`,
  );

  const columns: ColumnDef[] = [
    { key: "url", header: "URL", width: 50 },
    { key: "region", header: "Region", width: 15 },
  ];

  ctx.output.table(pages as unknown as Record<string, unknown>[], columns);
}
