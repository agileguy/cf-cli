import type { Context, ZoneSetting } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const setting = getStringFlag(flags, "setting");
  const rawValue = getStringFlag(flags, "value");

  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");
  if (!setting) throw new UsageError("--setting <setting-id> is required.");
  if (rawValue === undefined) throw new UsageError("--value <value> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  // Try JSON parse first, fall back to string
  let value: unknown;
  try {
    value = JSON.parse(rawValue);
  } catch {
    value = rawValue;
  }

  const result = await ctx.client.patch<ZoneSetting>(
    `/zones/${encodeURIComponent(zoneId)}/settings/${encodeURIComponent(setting)}`,
    { value },
  );

  ctx.output.success(`Setting "${result.id}" updated.`);
}
