import type { Context, SSLRecommendation } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const recommendation = await ctx.client.get<SSLRecommendation>(
    `/zones/${encodeURIComponent(zoneId)}/ssl/recommendation`,
  );

  ctx.output.detail({
    "ID": recommendation.id ?? "",
    "Recommended Mode": recommendation.value ?? "",
    "Modified": recommendation.modified_on ?? "",
  });
}
