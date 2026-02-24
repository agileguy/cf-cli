import type { Context, RadarASN } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const asn = getStringFlag(flags, "asn");
  if (!asn) throw new UsageError("--asn <number> is required.");

  const result = await ctx.client.get<RadarASN>(
    `/radar/entities/asns/${encodeURIComponent(asn)}`,
  );

  ctx.output.json(result);
}
