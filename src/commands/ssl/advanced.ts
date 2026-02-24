import type { Context, AdvancedCertificatePack, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag, getListFlag, getNumberFlag, getBoolFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

const USAGE = `Usage: cf ssl advanced <action>

Actions:
  list    List advanced certificate packs
  order   Order an advanced certificate pack`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [action, ...rest] = args;

  switch (action) {
    case "list":
    case "ls":
      return listPacks(rest, ctx);
    case "order":
      return orderPack(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown ssl advanced action: "${action}"\n\n${USAGE}`);
  }
}

async function listPacks(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const packs = await ctx.client.get<AdvancedCertificatePack[]>(
    `/zones/${encodeURIComponent(zoneId)}/ssl/certificate_packs`,
    { status: "all" },
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "type", header: "Type", width: 16 },
    { key: "status", header: "Status", width: 14 },
    { key: "hosts", header: "Hosts", transform: (v: unknown) => Array.isArray(v) ? v.join(", ") : String(v ?? "") },
  ];

  ctx.output.table(packs as unknown as Record<string, unknown>[], columns);
}

async function orderPack(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const hosts = getListFlag(flags, "hosts");
  if (!hosts || hosts.length === 0) throw new UsageError("--hosts <host1,host2,...> is required.");

  const validationMethod = getStringFlag(flags, "validationMethod") ?? "txt";
  const validityDays = getNumberFlag(flags, "validityDays") ?? 365;
  const ca = getStringFlag(flags, "ca") ?? "lets_encrypt";
  const cloudflareBranding = getBoolFlag(flags, "cloudflareBranding");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const pack = await ctx.client.post<AdvancedCertificatePack>(
    `/zones/${encodeURIComponent(zoneId)}/ssl/certificate_packs/order`,
    {
      type: "advanced",
      hosts,
      validation_method: validationMethod,
      validity_days: validityDays,
      certificate_authority: ca,
      cloudflare_branding: cloudflareBranding,
    },
  );

  ctx.output.success(`Advanced certificate pack ordered: ${pack.id}`);
  ctx.output.detail({
    "ID": pack.id,
    "Status": pack.status,
    "Hosts": pack.hosts.join(", "),
    "CA": pack.certificate_authority ?? ca,
    "Validity": `${pack.validity_days ?? validityDays} days`,
  });
}
