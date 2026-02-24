import type { Context, Healthcheck } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <healthcheck-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const hc = await ctx.client.get<Healthcheck>(
    `/zones/${encodeURIComponent(zoneId)}/healthchecks/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": hc.id,
    "Name": hc.name,
    "Address": hc.address,
    "Type": hc.type ?? "",
    "Status": hc.status ?? "",
    "Suspended": hc.suspended ?? false,
    "Interval": hc.interval ?? "",
    "Timeout": hc.timeout ?? "",
    "Retries": hc.retries ?? "",
    "Check Regions": hc.check_regions?.join(", ") ?? "",
    "Created": hc.created_on ?? "",
    "Modified": hc.modified_on ?? "",
  });
}
