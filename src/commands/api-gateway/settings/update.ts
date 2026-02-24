import type { Context, APIGatewaySettings } from "../../../types/index.js";
import { parseArgs, getStringFlag, getBoolFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const body: Record<string, unknown> = {};

  if (flags["enabled"] !== undefined) {
    body["enabled"] = getBoolFlag(flags, "enabled");
  }

  if (Object.keys(body).length === 0) {
    throw new UsageError("At least one setting flag is required (--enabled).");
  }

  await ctx.client.put<APIGatewaySettings>(
    `/zones/${encodeURIComponent(zoneId)}/api_gateway/settings`,
    body,
  );

  const enabled = body["enabled"] as boolean;
  ctx.output.success(`API Gateway ${enabled ? "enabled" : "disabled"} for zone "${zone}".`);
}
