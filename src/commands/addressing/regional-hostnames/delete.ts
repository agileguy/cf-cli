import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const hostname = getStringFlag(flags, "hostname");
  if (!hostname) throw new UsageError("--hostname <hostname> is required.");

  const confirmed = await confirm(
    `Delete regional hostname "${hostname}"?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  await ctx.client.delete<void>(
    `/zones/${encodeURIComponent(zoneId)}/addressing/regional_hostnames/${encodeURIComponent(hostname)}`,
  );

  ctx.output.success(`Regional hostname "${hostname}" deleted.`);
}
