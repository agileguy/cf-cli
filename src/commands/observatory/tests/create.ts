import type { Context, ObservatoryTest } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const url = getStringFlag(flags, "url");
  if (!url) throw new UsageError("--url <page-url> is required.");

  const region = getStringFlag(flags, "region");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const body: Record<string, unknown> = { url };
  if (region) body["region"] = region;

  const test = await ctx.client.post<ObservatoryTest>(
    `/zones/${encodeURIComponent(zoneId)}/speed_api/pages/${encodeURIComponent(url)}/tests`,
    body,
  );

  ctx.output.success(`Speed test created (ID: ${test.id}).`);
  ctx.output.detail({
    "ID": test.id,
    "URL": test.url,
    "Region": test.region ?? "—",
    "Date": test.date ?? "—",
  });
}
