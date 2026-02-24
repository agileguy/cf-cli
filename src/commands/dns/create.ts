import type { Context, DnsRecord } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { validateRecordType, validateTTL, validatePriority } from "../../utils/validators.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const type = getStringFlag(flags, "type");
  const name = getStringFlag(flags, "name");
  const content = getStringFlag(flags, "content");
  const ttlRaw = getStringFlag(flags, "ttl") ?? getNumberFlag(flags, "ttl");
  const proxied = flags["proxied"];
  const priorityRaw = getStringFlag(flags, "priority");
  const comment = getStringFlag(flags, "comment");

  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");
  if (!type) throw new UsageError("--type <record-type> is required.");
  if (!name) throw new UsageError("--name <record-name> is required.");
  if (!content) throw new UsageError("--content <value> is required.");

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

  if (comment !== undefined) {
    body["comment"] = comment;
  }

  const record = await ctx.client.post<DnsRecord>(
    `/zones/${zoneId}/dns_records`,
    body,
  );

  ctx.output.success(`DNS record created: ${record.id}`);
  ctx.output.detail({
    "ID": record.id,
    "Type": record.type,
    "Name": record.name,
    "Content": record.content,
    "TTL": record.ttl === 1 ? "Auto" : record.ttl,
    "Proxied": record.proxied,
  });
}
