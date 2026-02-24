import type { Context, DnsRecord } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { validateRecordType, validateTTL, validatePriority } from "../../utils/validators.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const id = getStringFlag(flags, "id");
  const type = getStringFlag(flags, "type");
  const name = getStringFlag(flags, "name");
  const content = getStringFlag(flags, "content");
  const ttlRaw = getStringFlag(flags, "ttl") ?? getNumberFlag(flags, "ttl");
  const proxied = flags["proxied"];
  const priorityRaw = getStringFlag(flags, "priority");

  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");
  if (!id) throw new UsageError("--id <record-id> is required.");
  if (!type) throw new UsageError("--type <record-type> is required for full update. Use 'cf dns patch' for partial updates.");
  if (!name) throw new UsageError("--name <record-name> is required for full update. Use 'cf dns patch' for partial updates.");
  if (!content) throw new UsageError("--content <value> is required for full update. Use 'cf dns patch' for partial updates.");

  const recordType = validateRecordType(type);
  const zoneId = await resolveZoneId(zone, ctx.client);

  const body: Record<string, unknown> = {
    type: recordType,
    name,
    content,
  };

  if (ttlRaw !== undefined) {
    body["ttl"] = validateTTL(ttlRaw);
  }

  if (proxied !== undefined) {
    body["proxied"] = typeof proxied === "boolean" ? proxied : proxied === "true";
  }

  if (priorityRaw !== undefined) {
    body["priority"] = validatePriority(priorityRaw);
  }

  const record = await ctx.client.put<DnsRecord>(
    `/zones/${zoneId}/dns_records/${id}`,
    body,
  );

  ctx.output.success(`DNS record updated: ${record.id}`);
  ctx.output.detail({
    "ID": record.id,
    "Type": record.type,
    "Name": record.name,
    "Content": record.content,
    "TTL": record.ttl === 1 ? "Auto" : record.ttl,
    "Proxied": record.proxied,
  });
}
