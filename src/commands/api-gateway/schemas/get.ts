import type { Context, APIGatewaySchema } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <schema-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const schema = await ctx.client.get<APIGatewaySchema>(
    `/zones/${encodeURIComponent(zoneId)}/api_gateway/user_schemas/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": schema.schema_id,
    "Name": schema.name,
    "Kind": schema.kind ?? "(unknown)",
    "Source": schema.source ?? "(unknown)",
    "Validation": schema.validation_enabled ? "enabled" : "disabled",
    "Created": schema.created_at ?? "(unknown)",
  });
}
