import type { Context, LoadBalancer, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const lbs = await ctx.client.get<LoadBalancer[]>(
    `/zones/${encodeURIComponent(zoneId)}/load_balancers`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "enabled", header: "Enabled", width: 8, transform: (v: unknown) => (v as boolean) ? "Yes" : "No" },
    { key: "proxied", header: "Proxied", width: 8, transform: (v: unknown) => (v as boolean) ? "Yes" : "No" },
    { key: "steering_policy", header: "Steering", width: 14 },
    { key: "created_on", header: "Created" },
  ];

  ctx.output.table(lbs as unknown as Record<string, unknown>[], columns);
}
