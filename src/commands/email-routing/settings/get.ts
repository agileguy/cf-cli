import type { Context, EmailRoutingSettings } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const settings = await ctx.client.get<EmailRoutingSettings>(
    `/zones/${encodeURIComponent(zoneId)}/email/routing`,
  );

  ctx.output.detail({
    "Tag": settings.tag,
    "Name": settings.name,
    "Enabled": settings.enabled,
    "Status": settings.status,
    "Skip Wizard": settings.skip_wizard,
    "Created": settings.created,
    "Modified": settings.modified,
  });
}
