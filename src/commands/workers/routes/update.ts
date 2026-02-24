import type { Context, WorkerRoute } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const id = getStringFlag(flags, "id");
  const pattern = getStringFlag(flags, "pattern");
  const script = getStringFlag(flags, "script");

  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");
  if (!id) throw new UsageError("--id <route-id> is required.");
  if (!pattern) throw new UsageError("--pattern <route-pattern> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const body: Record<string, string> = { pattern };
  if (script) {
    body["script"] = script;
  }

  const route = await ctx.client.put<WorkerRoute>(
    `/zones/${zoneId}/workers/routes/${id}`,
    body,
  );

  ctx.output.success(`Worker route ${id} updated.`);
  ctx.output.detail({
    "ID": route.id,
    "Pattern": route.pattern,
    "Script": route.script,
  });
}
