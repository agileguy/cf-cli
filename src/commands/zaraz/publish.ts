import type { Context, ZarazPublishResult } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const result = await ctx.client.post<ZarazPublishResult>(
    `/zones/${encodeURIComponent(zoneId)}/settings/zaraz/v2/publish`,
    {},
  );

  ctx.output.success(result.message ?? "Zaraz configuration published.");
}
