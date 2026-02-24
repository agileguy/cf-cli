import type { Context, SSLVerification, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const verifications = await ctx.client.get<SSLVerification[]>(
    `/zones/${encodeURIComponent(zoneId)}/ssl/verification`,
  );

  const columns: ColumnDef[] = [
    { key: "hostname", header: "Hostname", width: 30 },
    { key: "certificate_status", header: "Cert Status", width: 16 },
    { key: "validation_method", header: "Method", width: 10 },
    { key: "verification_type", header: "Type", width: 12 },
    { key: "cert_pack_uuid", header: "Pack UUID", width: 36 },
  ];

  ctx.output.table(verifications as unknown as Record<string, unknown>[], columns);
}
