import type { Context, WaitingRoomRule, ColumnDef } from "../../../types/index.js";
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

  const rules = await ctx.client.get<WaitingRoomRule[]>(
    `/zones/${encodeURIComponent(zoneId)}/waiting_rooms/${encodeURIComponent(room)}/rules`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "action", header: "Action", width: 20 },
    { key: "expression", header: "Expression", width: 40 },
    { key: "description", header: "Description", width: 25 },
    { key: "enabled", header: "Enabled", width: 8 },
  ];

  ctx.output.table(rules as unknown as Record<string, unknown>[], columns);
}
