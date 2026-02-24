import type { Context, PageRule } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const id = getStringFlag(flags, "id");

  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");
  if (!id) throw new UsageError("--id <pagerule-id> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const rule = await ctx.client.get<PageRule>(
    `/zones/${encodeURIComponent(zoneId)}/pagerules/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": rule.id,
    "Target": rule.targets?.[0]?.constraint?.value ?? "-",
    "Actions": JSON.stringify(rule.actions, null, 2),
    "Status": rule.status ?? "-",
    "Priority": rule.priority ?? "-",
    "Created": rule.created_on ?? "-",
    "Modified": rule.modified_on ?? "-",
  });
}
