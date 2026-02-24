import type { Context, PageShieldScript, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const scripts = await ctx.client.get<PageShieldScript[]>(
    `/zones/${encodeURIComponent(zoneId)}/page_shield/scripts`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "url", header: "URL", width: 50 },
    { key: "host", header: "Host", width: 24 },
    {
      key: "domain_reported_malicious",
      header: "Malicious",
      width: 10,
      transform: (v: unknown) => (v as boolean) ? "Yes" : "No",
    },
    {
      key: "last_seen_at",
      header: "Last Seen",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "",
    },
  ];

  ctx.output.table(scripts, columns);
}
