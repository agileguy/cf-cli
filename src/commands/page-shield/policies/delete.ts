import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const id = getStringFlag(flags, "id");

  if (!zone) throw new UsageError("--zone <zone> is required.");
  if (!id) throw new UsageError("--id <policy-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const confirmed = await confirm(
    `Delete Page Shield policy ${id}?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<{ id: string }>(
    `/zones/${encodeURIComponent(zoneId)}/page_shield/policies/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Page Shield policy ${id} deleted.`);
}
