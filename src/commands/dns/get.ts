import type { Context, DnsRecord } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const id = getStringFlag(flags, "id");

  if (!zone) {
    throw new UsageError("--zone <zone-id-or-name> is required.");
  }
  if (!id) {
    throw new UsageError("--id <record-id> is required.");
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  const record = await ctx.client.get<DnsRecord>(
    `/zones/${zoneId}/dns_records/${id}`,
  );

  ctx.output.detail({
    "ID": record.id,
    "Zone ID": record.zone_id,
    "Zone Name": record.zone_name,
    "Type": record.type,
    "Name": record.name,
    "Content": record.content,
    "Proxiable": record.proxiable,
    "Proxied": record.proxied,
    "TTL": record.ttl === 1 ? "Auto" : record.ttl,
    "Locked": record.locked,
    "Comment": record.comment ?? "-",
    "Tags": record.tags.length > 0 ? record.tags.join(", ") : "-",
    "Priority": record.priority ?? "-",
    "Created": record.created_on,
    "Modified": record.modified_on,
  });
}
