import type { Context, SpectrumApp, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const apps = await ctx.client.get<SpectrumApp[]>(
    `/zones/${encodeURIComponent(zoneId)}/spectrum/apps`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "protocol", header: "Protocol", width: 12 },
    { key: "dns", header: "DNS Name", width: 30, transform: (v: unknown) => {
      const dns = v as { name?: string } | undefined;
      return dns?.name ?? "";
    }},
    { key: "tls", header: "TLS", width: 8 },
    { key: "created_on", header: "Created", width: 24 },
  ];

  ctx.output.table(apps as unknown as Record<string, unknown>[], columns);
}
