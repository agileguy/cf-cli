import type { Context, WorkerRoute } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const pattern = getStringFlag(flags, "pattern");
  const script = getStringFlag(flags, "script");

  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");
  if (!pattern) throw new UsageError("--pattern <route-pattern> is required.");
  if (!script) throw new UsageError("--script <worker-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const route = await ctx.client.post<WorkerRoute>(
    `/zones/${zoneId}/workers/routes`,
    { pattern, script },
  );

  ctx.output.success(`Worker route created: ${route.id}`);
  ctx.output.detail({
    "ID": route.id,
    "Pattern": route.pattern,
    "Script": route.script,
  });
}
