import type { Context, PageShieldSettings } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const settings = await ctx.client.get<PageShieldSettings>(
    `/zones/${encodeURIComponent(zoneId)}/page_shield`,
  );

  ctx.output.detail({
    "Enabled": settings.enabled,
    "Updated At": settings.updated_at ?? "",
    "Use Cloudflare Reporting Endpoint": settings.use_cloudflare_reporting_endpoint ?? false,
    "Use Connection URL Path": settings.use_connection_url_path ?? false,
  });
}
