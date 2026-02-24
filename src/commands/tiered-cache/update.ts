import type { Context, TieredCacheSetting } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const value = getStringFlag(flags, "value");
  if (!value || (value !== "on" && value !== "off")) {
    throw new UsageError("--value <on|off> is required.");
  }

  const topology = getStringFlag(flags, "topology");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const body: Record<string, unknown> = { value };
  if (topology) body["topology"] = topology;

  const result = await ctx.client.patch<TieredCacheSetting>(
    `/zones/${encodeURIComponent(zoneId)}/argo/tiered_caching`,
    body,
  );

  ctx.output.success(`Tiered Cache set to "${result.value}".`);
}
