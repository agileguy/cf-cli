import type { Context, DCVDelegation } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const delegations = await ctx.client.get<DCVDelegation[]>(
    `/zones/${encodeURIComponent(zoneId)}/dcv_delegation`,
  );

  if (!Array.isArray(delegations) || delegations.length === 0) {
    ctx.output.info("No DCV delegation UUIDs found.");
    return;
  }

  for (const d of delegations) {
    ctx.output.detail({ "UUID": d.uuid });
  }
}
