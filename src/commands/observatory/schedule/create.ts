import type { Context, ObservatorySchedule } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const url = getStringFlag(flags, "url");
  if (!url) throw new UsageError("--url <page-url> is required.");

  const region = getStringFlag(flags, "region");
  const frequency = getStringFlag(flags, "frequency");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const body: Record<string, unknown> = { url };
  if (region) body["region"] = region;
  if (frequency) body["frequency"] = frequency;

  const schedule = await ctx.client.post<ObservatorySchedule>(
    `/zones/${encodeURIComponent(zoneId)}/speed_api/schedule/${encodeURIComponent(url)}`,
    body,
  );

  ctx.output.success(`Schedule created for "${schedule.url}".`);
  ctx.output.detail({
    "URL": schedule.url,
    "Region": schedule.region ?? "—",
    "Frequency": schedule.frequency ?? "—",
  });
}
