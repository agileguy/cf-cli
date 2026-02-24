import type { Context, ZarazHistoryEntry } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const history = await ctx.client.get<ZarazHistoryEntry[]>(
    `/zones/${encodeURIComponent(zoneId)}/settings/zaraz/v2/history`,
  );
  const list = Array.isArray(history) ? history : [];

  ctx.output.table(list, [
    { key: "id", header: "ID" },
    { key: "description", header: "Description" },
    { key: "created_at", header: "Created" },
    { key: "user_id", header: "User" },
  ]);
}
