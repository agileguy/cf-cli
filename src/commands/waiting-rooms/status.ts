import type { Context, WaitingRoomStatus } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <waiting-room-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const result = await ctx.client.get<WaitingRoomStatus>(
    `/zones/${encodeURIComponent(zoneId)}/waiting_rooms/${encodeURIComponent(id)}/status`,
  );

  ctx.output.detail({
    "Status": result.status,
    "Event ID": result.event_id ?? "—",
    "Queued Users": result.estimated_queued_users ?? "—",
    "Active Users": result.estimated_total_active_users ?? "—",
    "Est. Wait (min)": result.max_estimated_time_minutes ?? "—",
  });
}
