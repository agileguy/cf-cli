import type { Context, ZoneSetting } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const setting = getStringFlag(flags, "setting");

  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");
  if (!setting) throw new UsageError("--setting <setting-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const result = await ctx.client.get<ZoneSetting>(
    `/zones/${encodeURIComponent(zoneId)}/settings/${encodeURIComponent(setting)}`,
  );

  const displayValue = typeof result.value === "object" && result.value !== null
    ? JSON.stringify(result.value, null, 2)
    : String(result.value);

  ctx.output.detail({
    "Setting": result.id,
    "Value": displayValue,
    "Editable": result.editable ?? "-",
    "Modified": result.modified_on ?? "-",
  });
}
