import type { Context, RateLimitRule } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";
export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <rule-id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <ratelimit-json> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  let body: unknown;
  try {
    body = JSON.parse(content);
  } catch {
    throw new UsageError(`File "${file}" does not contain valid JSON.`);
  }

  const result = await ctx.client.put<RateLimitRule>(
    `/zones/${encodeURIComponent(zoneId)}/rate_limits/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Rate limit rule "${result.id}" updated.`);
}
