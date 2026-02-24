import type { Context, WaitingRoom, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const rooms = await ctx.client.get<WaitingRoom[]>(
    `/zones/${encodeURIComponent(zoneId)}/waiting_rooms`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "host", header: "Host", width: 30 },
    { key: "path", header: "Path", width: 15 },
    { key: "new_users_per_minute", header: "New/min", width: 10 },
    { key: "total_active_users", header: "Max Active", width: 12 },
  ];

  ctx.output.table(rooms as unknown as Record<string, unknown>[], columns);
}
