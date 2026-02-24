import type { Context, RegionalHostname } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const hostname = getStringFlag(flags, "hostname");
  if (!hostname) throw new UsageError("--hostname <hostname> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const rh = await ctx.client.get<RegionalHostname>(
    `/zones/${encodeURIComponent(zoneId)}/addressing/regional_hostnames/${encodeURIComponent(hostname)}`,
  );

  ctx.output.detail({
    "Hostname": rh.hostname,
    "Region": rh.region_key ?? "",
    "Created": rh.created_on ?? "",
    "Modified": rh.modified_on ?? "",
  });
}
