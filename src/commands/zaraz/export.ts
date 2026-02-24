import type { Context, ZarazConfig } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const outputFile = getStringFlag(flags, "outputFile");
  if (!outputFile) throw new UsageError("--output-file <path> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const config = await ctx.client.get<ZarazConfig>(
    `/zones/${encodeURIComponent(zoneId)}/settings/zaraz/v2/export`,
  );

  await Bun.write(outputFile, JSON.stringify(config, null, 2));

  ctx.output.success(`Zaraz configuration exported to "${outputFile}".`);
}
