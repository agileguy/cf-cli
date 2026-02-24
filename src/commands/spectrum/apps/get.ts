import type { Context, SpectrumApp } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <app-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const app = await ctx.client.get<SpectrumApp>(
    `/zones/${encodeURIComponent(zoneId)}/spectrum/apps/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": app.id,
    "Protocol": app.protocol,
    "DNS Type": app.dns?.type ?? "",
    "DNS Name": app.dns?.name ?? "",
    "Origin Direct": app.origin_direct?.join(", ") ?? "",
    "Origin Port": app.origin_port ?? "",
    "Origin DNS": app.origin_dns?.name ?? "",
    "IP Firewall": app.ip_firewall ?? false,
    "Proxy Protocol": app.proxy_protocol ?? "",
    "TLS": app.tls ?? "",
    "Argo Smart Routing": app.argo_smart_routing ?? false,
    "Created": app.created_on ?? "",
    "Modified": app.modified_on ?? "",
  });
}
