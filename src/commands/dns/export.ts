import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");

  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  // DNS export returns raw BIND format text, not JSON.
  // Use the client get which will attempt JSON parse. The API actually
  // returns text/plain for this endpoint. We'll get the raw text via
  // a direct approach.
  const result = await ctx.client.get<string>(
    `/zones/${zoneId}/dns_records/export`,
  );

  // Output raw BIND format directly to stdout
  process.stdout.write(String(result));
  if (!String(result).endsWith("\n")) {
    process.stdout.write("\n");
  }
}
