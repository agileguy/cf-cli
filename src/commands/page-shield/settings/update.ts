import type { Context, PageShieldSettings } from "../../../types/index.js";
import { parseArgs, getStringFlag, getBoolFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const body: Record<string, unknown> = {};

  // --enabled / --no-enabled
  if (flags["enabled"] !== undefined) {
    body["enabled"] = getBoolFlag(flags, "enabled");
  }

  // --use-cloudflare-reporting-endpoint / --no-use-cloudflare-reporting-endpoint
  if (flags["useCloudflareReportingEndpoint"] !== undefined) {
    body["use_cloudflare_reporting_endpoint"] = getBoolFlag(flags, "useCloudflareReportingEndpoint");
  }

  // --use-connection-url-path / --no-use-connection-url-path
  if (flags["useConnectionUrlPath"] !== undefined) {
    body["use_connection_url_path"] = getBoolFlag(flags, "useConnectionUrlPath");
  }

  if (Object.keys(body).length === 0) {
    throw new UsageError("At least one setting flag is required (--enabled, --use-cloudflare-reporting-endpoint, --use-connection-url-path).");
  }

  const settings = await ctx.client.put<PageShieldSettings>(
    `/zones/${encodeURIComponent(zoneId)}/page_shield`,
    body,
  );

  ctx.output.success("Page Shield settings updated.");
  ctx.output.detail({
    "Enabled": settings.enabled,
    "Use Cloudflare Reporting Endpoint": settings.use_cloudflare_reporting_endpoint ?? false,
    "Use Connection URL Path": settings.use_connection_url_path ?? false,
  });
}
