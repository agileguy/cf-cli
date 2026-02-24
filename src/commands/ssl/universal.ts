import type { Context, UniversalSSLSettings } from "../../types/index.js";
import { parseArgs, getStringFlag, getBoolFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

const USAGE = `Usage: cf ssl universal <action>

Actions:
  get       Get Universal SSL settings
  update    Update Universal SSL settings (--enabled / --no-enabled)`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [action, ...rest] = args;

  switch (action) {
    case "get":
      return getSettings(rest, ctx);
    case "update":
      return updateSettings(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown ssl universal action: "${action}"\n\n${USAGE}`);
  }
}

async function getSettings(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const settings = await ctx.client.get<UniversalSSLSettings>(
    `/zones/${encodeURIComponent(zoneId)}/ssl/universal/settings`,
  );

  ctx.output.detail({
    "Enabled": settings.enabled,
  });
}

async function updateSettings(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const enabled = getBoolFlag(flags, "enabled");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const settings = await ctx.client.patch<UniversalSSLSettings>(
    `/zones/${encodeURIComponent(zoneId)}/ssl/universal/settings`,
    { enabled },
  );

  ctx.output.success(`Universal SSL ${settings.enabled ? "enabled" : "disabled"}.`);
}
