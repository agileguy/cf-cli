import type { Context, WorkerRoute, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const routes = await ctx.client.get<WorkerRoute[]>(
    `/zones/${zoneId}/workers/routes`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "pattern", header: "Pattern", width: 40 },
    { key: "script", header: "Script", width: 30 },
  ];

  ctx.output.table(routes as unknown as Record<string, unknown>[], columns);
}
