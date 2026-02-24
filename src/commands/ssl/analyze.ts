import type { Context, SSLAnalyzeResult } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const hostname = getStringFlag(flags, "hostname");
  if (!hostname) throw new UsageError("--hostname <hostname> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const result = await ctx.client.post<SSLAnalyzeResult>(
    `/zones/${encodeURIComponent(zoneId)}/ssl/analyze`,
    { hostname },
  );

  ctx.output.detail({
    "Hostname": result.hostname,
    "Status": result.certificate_status ?? "",
    "CA": result.certificate_authority ?? "",
    "Valid From": result.valid_from ?? "",
    "Valid To": result.valid_to ?? "",
    "Signature": result.signature_algorithm ?? "",
    "Issuer": result.issuer ?? "",
    "SANs": result.sans?.join(", ") ?? "",
  });
}
