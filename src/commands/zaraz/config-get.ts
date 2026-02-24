import type { Context, ZarazConfig } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const config = await ctx.client.get<ZarazConfig>(
    `/zones/${encodeURIComponent(zoneId)}/settings/zaraz/v2/config`,
  );

  ctx.output.json(config);
}
