import type { Context, ZoneAnalyticsColo } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const from = getStringFlag(flags, "from");
  const to = getStringFlag(flags, "to");

  const params: Record<string, string> = {};
  if (from) params["since"] = from;
  if (to) params["until"] = to;

  const data = await ctx.client.get<ZoneAnalyticsColo[]>(
    `/zones/${encodeURIComponent(zoneId)}/analytics/colos`,
    params,
  );

  ctx.output.json(data);
}
