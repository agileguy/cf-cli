import type { Context, CacheReserveSetting } from "../../types/index.js";
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

  const zoneId = await resolveZoneId(zone, ctx.client);

  const result = await ctx.client.patch<CacheReserveSetting>(
    `/zones/${encodeURIComponent(zoneId)}/cache/cache_reserve`,
    { value },
  );

  ctx.output.success(`Cache Reserve set to "${result.value}".`);
}
