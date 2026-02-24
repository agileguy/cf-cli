import type { Context, PageShieldScript } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const id = getStringFlag(flags, "id");

  if (!zone) throw new UsageError("--zone <zone> is required.");
  if (!id) throw new UsageError("--id <script-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const script = await ctx.client.get<PageShieldScript>(
    `/zones/${encodeURIComponent(zoneId)}/page_shield/scripts/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": script.id,
    "URL": script.url,
    "Host": script.host ?? "",
    "Hash": script.hash ?? "",
    "JS Integrity Score": script.js_integrity_score ?? "",
    "Domain Reported Malicious": script.domain_reported_malicious ?? false,
    "Added At": script.added_at ?? "",
    "First Seen At": script.first_seen_at ?? "",
    "Last Seen At": script.last_seen_at ?? "",
    "Page URLs": script.page_urls?.join(", ") ?? "",
  });
}
