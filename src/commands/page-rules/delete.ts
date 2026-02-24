import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { confirm } from "../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const id = getStringFlag(flags, "id");

  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");
  if (!id) throw new UsageError("--id <pagerule-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const confirmed = await confirm(`Delete page rule "${id}"?`, ctx.flags);

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<{ id: string }>(
    `/zones/${encodeURIComponent(zoneId)}/pagerules/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Page rule ${id} deleted.`);
}
