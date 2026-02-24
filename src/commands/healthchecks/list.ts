import type { Context, Healthcheck, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const healthchecks = await ctx.client.get<Healthcheck[]>(
    `/zones/${encodeURIComponent(zoneId)}/healthchecks`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 24 },
    { key: "address", header: "Address", width: 30 },
    { key: "type", header: "Type", width: 8 },
    { key: "status", header: "Status", width: 12 },
    { key: "suspended", header: "Suspended", width: 10, transform: (v: unknown) => (v as boolean) ? "Yes" : "No" },
  ];

  ctx.output.table(healthchecks as unknown as Record<string, unknown>[], columns);
}
