import type { Context, RateLimitRule, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const rules = await ctx.client.get<RateLimitRule[]>(
    `/zones/${encodeURIComponent(zoneId)}/rate_limits`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "description", header: "Description", width: 30 },
    { key: "match.request.url", header: "URL Pattern", width: 30 },
    { key: "threshold", header: "Threshold", width: 10 },
    { key: "period", header: "Period (s)", width: 10 },
    { key: "action.mode", header: "Action", width: 12 },
    { key: "disabled", header: "Disabled", width: 8, transform: (v: unknown) => v ? "yes" : "no" },
  ];

  ctx.output.table(rules as unknown as Record<string, unknown>[], columns);
}
