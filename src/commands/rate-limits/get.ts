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

  const zoneId = await resolveZoneId(zone, ctx.client);

  const rule = await ctx.client.get<RateLimitRule>(
    `/zones/${encodeURIComponent(zoneId)}/rate_limits/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": rule.id,
    "Description": rule.description ?? "(none)",
    "URL Pattern": rule.match.request.url,
    "Methods": rule.match.request.methods?.join(", ") ?? "(all)",
    "Threshold": rule.threshold,
    "Period": `${rule.period}s`,
    "Action": rule.action.mode,
    "Action Timeout": rule.action.timeout != null ? `${rule.action.timeout}s` : "(none)",
    "Disabled": rule.disabled ?? false,
  });
}
