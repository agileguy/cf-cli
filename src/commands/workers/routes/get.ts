import type { Context, WorkerRoute } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const id = getStringFlag(flags, "id");

  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");
  if (!id) throw new UsageError("--id <route-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const route = await ctx.client.get<WorkerRoute>(
    `/zones/${zoneId}/workers/routes/${id}`,
  );

  ctx.output.detail({
    "ID": route.id,
    "Pattern": route.pattern,
    "Script": route.script,
  });
}
