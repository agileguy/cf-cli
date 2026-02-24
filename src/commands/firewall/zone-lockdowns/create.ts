import type { Context, FirewallZoneLockdown } from "../../../types/index.js";
import { parseArgs, getStringFlag, getListFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const url = getStringFlag(flags, "url");
  const ips = getListFlag(flags, "ips");
  const description = getStringFlag(flags, "description");

  if (!zone) throw new UsageError("--zone <zone> is required.");
  if (!url) throw new UsageError("--url <url-pattern> is required.");
  if (!ips || ips.length === 0) throw new UsageError("--ips <ip1,ip2,...> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const body: Record<string, unknown> = {
    urls: [url],
    configurations: ips.map((ip) => ({
      target: ip.includes("/") ? "ip_range" : "ip",
      value: ip,
    })),
  };

  if (description) body["description"] = description;

  const lockdown = await ctx.client.post<FirewallZoneLockdown>(
    `/zones/${encodeURIComponent(zoneId)}/firewall/lockdowns`,
    body,
  );

  ctx.output.success(`Zone lockdown created: ${lockdown.id}`);
  ctx.output.detail({
    "ID": lockdown.id,
    "URLs": lockdown.urls.join(", "),
    "IPs": lockdown.configurations.map((c) => c.value).join(", "),
    "Description": lockdown.description ?? "",
  });
}
