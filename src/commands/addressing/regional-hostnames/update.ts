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

  const region = getStringFlag(flags, "region");
  if (!region) throw new UsageError("--region <region-key> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const rh = await ctx.client.patch<RegionalHostname>(
    `/zones/${encodeURIComponent(zoneId)}/addressing/regional_hostnames/${encodeURIComponent(hostname)}`,
    { region_key: region },
  );

  ctx.output.success(`Regional hostname "${hostname}" updated.`);
  ctx.output.detail({
    "Hostname": rh.hostname,
    "Region": rh.region_key,
    "Modified": rh.modified_on ?? "",
  });
}
