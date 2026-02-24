import type { Context, RadarSummary } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const params: Record<string, string> = {};
  const from = getStringFlag(flags, "from");
  const to = getStringFlag(flags, "to");
  const asn = getStringFlag(flags, "asn");
  const location = getStringFlag(flags, "location");

  if (from) params["dateStart"] = from;
  if (to) params["dateEnd"] = to;
  if (asn) params["asn"] = asn;
  if (location) params["location"] = location;

  const result = await ctx.client.get<RadarSummary>(
    "/radar/bgp/summary",
    params,
  );

  ctx.output.json(result);
}
