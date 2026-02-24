import type { Context, ObservatoryTest, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const url = getStringFlag(flags, "url");
  if (!url) throw new UsageError("--url <page-url> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const tests = await ctx.client.get<ObservatoryTest[]>(
    `/zones/${encodeURIComponent(zoneId)}/speed_api/pages/${encodeURIComponent(url)}/tests`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "url", header: "URL", width: 40 },
    { key: "region", header: "Region", width: 12 },
    { key: "date", header: "Date", width: 22 },
  ];

  ctx.output.table(tests as unknown as Record<string, unknown>[], columns);
}
