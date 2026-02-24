import type { Context, ObservatorySchedule, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const schedules = await ctx.client.get<ObservatorySchedule[]>(
    `/zones/${encodeURIComponent(zoneId)}/speed_api/schedule`,
  );

  const columns: ColumnDef[] = [
    { key: "url", header: "URL", width: 50 },
    { key: "region", header: "Region", width: 15 },
    { key: "frequency", header: "Frequency", width: 15 },
  ];

  ctx.output.table(schedules as unknown as Record<string, unknown>[], columns);
}
