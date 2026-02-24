import type { Context, WaitingRoom } from "../../types/index.js";
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

  const room = await ctx.client.get<WaitingRoom>(
    `/zones/${encodeURIComponent(zoneId)}/waiting_rooms/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": room.id,
    "Name": room.name,
    "Description": room.description ?? "—",
    "Host": room.host,
    "Path": room.path ?? "/",
    "New Users/Min": room.new_users_per_minute,
    "Max Active Users": room.total_active_users,
    "Session Duration": room.session_duration ?? "—",
    "Queueing Method": room.queueing_method ?? "—",
    "Suspended": room.suspended ?? false,
    "Created": room.created_on ?? "—",
    "Modified": room.modified_on ?? "—",
  });
}
