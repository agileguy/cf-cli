import type { Context, APIGatewaySchema } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { readFileSync } from "node:fs";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <openapi.json> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  let content: string;
  try {
    content = readFileSync(file, "utf-8");
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  // Validate it's valid JSON or YAML-ish
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new UsageError(`File "${file}" does not contain valid JSON.`);
  }

  const result = await ctx.client.post<APIGatewaySchema>(
    `/zones/${encodeURIComponent(zoneId)}/api_gateway/user_schemas`,
    parsed,
  );

  ctx.output.success(`Schema "${result.name}" uploaded (ID: ${result.schema_id}).`);
}
