import type { Context, SpectrumAnalytics } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const params: Record<string, string> = {};
  const from = getStringFlag(flags, "from");
  if (from) params.since = from;
  const to = getStringFlag(flags, "to");
  if (to) params.until = to;

  const analytics = await ctx.client.get<SpectrumAnalytics>(
    `/zones/${encodeURIComponent(zoneId)}/spectrum/analytics/events/bytime`,
    params,
  );

  ctx.output.json(analytics);
}
