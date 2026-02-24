import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { confirm } from "../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <rule-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const confirmed = await confirm(
    `Delete rate limit rule "${id}"?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `/zones/${encodeURIComponent(zoneId)}/rate_limits/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Rate limit rule "${id}" deleted.`);
}
