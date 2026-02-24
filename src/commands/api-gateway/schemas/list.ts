import type { Context, APIGatewaySchema, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const schemas = await ctx.client.get<APIGatewaySchema[]>(
    `/zones/${encodeURIComponent(zoneId)}/api_gateway/user_schemas`,
  );

  const columns: ColumnDef[] = [
    { key: "schema_id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "kind", header: "Kind", width: 12 },
    { key: "validation_enabled", header: "Validation", width: 12, transform: (v: unknown) => v ? "enabled" : "disabled" },
    { key: "created_at", header: "Created" },
  ];

  ctx.output.table(schemas as unknown as Record<string, unknown>[], columns);
}
