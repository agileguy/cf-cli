import type { Context, ZoneSetting, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const settings = await ctx.client.get<ZoneSetting[]>(
    `/zones/${encodeURIComponent(zoneId)}/settings`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "Setting", width: 32 },
    {
      key: "value",
      header: "Value",
      width: 30,
      transform: (v: unknown) => {
        if (typeof v === "object" && v !== null) return JSON.stringify(v);
        return String(v);
      },
    },
    {
      key: "editable",
      header: "Editable",
      width: 10,
      transform: (v: unknown) => (v === true ? "yes" : v === false ? "no" : "-"),
    },
    {
      key: "modified_on",
      header: "Modified",
      width: 12,
      transform: (v: unknown) => (typeof v === "string" ? v.slice(0, 10) : "-"),
    },
  ];

  ctx.output.table(settings, columns);
}
