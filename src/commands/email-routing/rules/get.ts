import type { Context, EmailRoutingRule } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <rule-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const rule = await ctx.client.get<EmailRoutingRule>(
    `/zones/${encodeURIComponent(zoneId)}/email/routing/rules/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "Tag": rule.tag,
    "Name": rule.name ?? "",
    "Enabled": rule.enabled ?? true,
    "Priority": rule.priority ?? 0,
    "Matchers": JSON.stringify(rule.matchers),
    "Actions": JSON.stringify(rule.actions),
  });
}
