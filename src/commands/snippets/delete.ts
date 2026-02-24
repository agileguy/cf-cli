import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { confirm } from "../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <snippet-name> is required.");

  const confirmed = await confirm(`Delete snippet "${name}"?`, ctx.flags);
  if (!confirmed) {
    ctx.output.warn("Aborted.");
    return;
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  await ctx.client.delete<void>(
    `/zones/${encodeURIComponent(zoneId)}/snippets/${encodeURIComponent(name)}`,
  );

  ctx.output.success(`Snippet "${name}" deleted.`);
}
