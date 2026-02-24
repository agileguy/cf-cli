import type { Context, PageShieldConnection } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const id = getStringFlag(flags, "id");

  if (!zone) throw new UsageError("--zone <zone> is required.");
  if (!id) throw new UsageError("--id <connection-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const connection = await ctx.client.get<PageShieldConnection>(
    `/zones/${encodeURIComponent(zoneId)}/page_shield/connections/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": connection.id,
    "URL": connection.url,
    "Host": connection.host ?? "",
    "Domain Reported Malicious": connection.domain_reported_malicious ?? false,
    "Added At": connection.added_at ?? "",
    "First Seen At": connection.first_seen_at ?? "",
    "Last Seen At": connection.last_seen_at ?? "",
    "Page URLs": connection.page_urls?.join(", ") ?? "",
  });
}
