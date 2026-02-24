import type { Context, ZarazWorkflow } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const workflow = await ctx.client.get<ZarazWorkflow>(
    `/zones/${encodeURIComponent(zoneId)}/settings/zaraz/v2/workflow`,
  );

  ctx.output.json(workflow);
}
