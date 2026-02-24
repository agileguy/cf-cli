import type { Context, LoadBalancer } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <load-balancer-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const lb = await ctx.client.get<LoadBalancer>(
    `/zones/${encodeURIComponent(zoneId)}/load_balancers/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": lb.id,
    "Name": lb.name,
    "Enabled": lb.enabled ?? false,
    "Proxied": lb.proxied ?? false,
    "TTL": lb.ttl ?? "",
    "Steering": lb.steering_policy ?? "",
    "Fallback Pool": lb.fallback_pool,
    "Default Pools": lb.default_pools.join(", "),
    "Session Affinity": lb.session_affinity ?? "",
    "Created": lb.created_on ?? "",
    "Modified": lb.modified_on ?? "",
  });
}
