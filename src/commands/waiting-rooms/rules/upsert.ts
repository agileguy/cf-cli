import type { Context, WaitingRoomRule } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const room = getStringFlag(flags, "room");
  if (!room) throw new UsageError("--room <waiting-room-id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <rules-json> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  let body: unknown;
  try {
    body = JSON.parse(content);
  } catch {
    throw new UsageError("File must contain valid JSON.");
  }

  const rules = await ctx.client.put<WaitingRoomRule[]>(
    `/zones/${encodeURIComponent(zoneId)}/waiting_rooms/${encodeURIComponent(room)}/rules`,
    body,
  );

  const count = Array.isArray(rules) ? rules.length : 0;
  ctx.output.success(`Waiting room rules updated (${count} rule${count === 1 ? "" : "s"}).`);
}
