import type { Context, FirewallZoneLockdown, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const lockdowns = await ctx.client.get<FirewallZoneLockdown[]>(
    `/zones/${encodeURIComponent(zoneId)}/firewall/lockdowns`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    {
      key: "urls",
      header: "URLs",
      width: 30,
      transform: (v: unknown) => (v as string[]).join(", "),
    },
    {
      key: "configurations",
      header: "IPs",
      width: 24,
      transform: (v: unknown) => (v as { value: string }[]).map((c) => c.value).join(", "),
    },
    {
      key: "paused",
      header: "Paused",
      width: 8,
      transform: (v: unknown) => (v as boolean) ? "Yes" : "No",
    },
    {
      key: "created_on",
      header: "Created",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "",
    },
  ];

  ctx.output.table(lockdowns, columns);
}
