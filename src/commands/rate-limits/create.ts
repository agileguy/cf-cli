import type { Context, RateLimitRule } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { readFileSync } from "node:fs";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <ratelimit-json> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  let content: string;
  try {
    content = readFileSync(file, "utf-8");
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  let body: unknown;
  try {
    body = JSON.parse(content);
  } catch {
    throw new UsageError(`File "${file}" does not contain valid JSON.`);
  }

  const result = await ctx.client.post<RateLimitRule>(
    `/zones/${encodeURIComponent(zoneId)}/rate_limits`,
    body,
  );

  ctx.output.success(`Rate limit rule created (ID: ${result.id}).`);
}
