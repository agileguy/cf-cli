import type { Context, DnsRecord } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { validateTTL } from "../../utils/validators.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const id = getStringFlag(flags, "id");
  const content = getStringFlag(flags, "content");
  const ttlRaw = getStringFlag(flags, "ttl") ?? getNumberFlag(flags, "ttl");
  const proxied = flags["proxied"];
  const comment = getStringFlag(flags, "comment");

  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");
  if (!id) throw new UsageError("--id <record-id> is required.");

  const body: Record<string, unknown> = {};

  if (content !== undefined) body["content"] = content;
  if (ttlRaw !== undefined) body["ttl"] = validateTTL(ttlRaw);
  if (proxied !== undefined) {
    body["proxied"] = typeof proxied === "boolean" ? proxied : proxied === "true";
  }
  if (comment !== undefined) body["comment"] = comment;

  if (Object.keys(body).length === 0) {
    throw new UsageError(
      "At least one field to patch is required: --content, --ttl, --proxied, --comment",
    );
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  const record = await ctx.client.patch<DnsRecord>(
    `/zones/${zoneId}/dns_records/${id}`,
    body,
  );

  ctx.output.success(`DNS record patched: ${record.id}`);
  ctx.output.detail({
    "ID": record.id,
    "Type": record.type,
    "Name": record.name,
    "Content": record.content,
    "TTL": record.ttl === 1 ? "Auto" : record.ttl,
    "Proxied": record.proxied,
  });
}
