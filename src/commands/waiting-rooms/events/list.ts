import type { Context, WaitingRoomEvent, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const room = getStringFlag(flags, "room");
  if (!room) throw new UsageError("--room <waiting-room-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const events = await ctx.client.get<WaitingRoomEvent[]>(
    `/zones/${encodeURIComponent(zoneId)}/waiting_rooms/${encodeURIComponent(room)}/events`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 25 },
    { key: "event_start_time", header: "Start", width: 22 },
    { key: "event_end_time", header: "End", width: 22 },
    { key: "suspended", header: "Suspended", width: 10 },
  ];

  ctx.output.table(events as unknown as Record<string, unknown>[], columns);
}
