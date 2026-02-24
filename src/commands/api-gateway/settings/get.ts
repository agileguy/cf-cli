import type { Context, APIGatewaySettings } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const settings = await ctx.client.get<APIGatewaySettings>(
    `/zones/${encodeURIComponent(zoneId)}/api_gateway/settings`,
  );

  ctx.output.detail({
    "Zone": zone,
    "API Gateway Enabled": settings.enabled,
  });
}
