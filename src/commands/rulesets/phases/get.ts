import type { Context, Ruleset } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const accountId = getStringFlag(flags, "accountId");
  const phase = getStringFlag(flags, "phase");

  if (!zone && !accountId) throw new UsageError("--zone <zone> or --account-id <id> is required.");
  if (zone && accountId) throw new UsageError("Specify either --zone or --account-id, not both.");
  if (!phase) throw new UsageError("--phase <phase-name> is required.");

  let basePath: string;
  if (zone) {
    const zoneId = await resolveZoneId(zone, ctx.client);
    basePath = `/zones/${encodeURIComponent(zoneId)}/rulesets`;
  } else {
    basePath = `/accounts/${encodeURIComponent(accountId!)}/rulesets`;
  }

  const ruleset = await ctx.client.get<Ruleset>(
    `${basePath}/phases/${encodeURIComponent(phase)}/entrypoint`,
  );

  ctx.output.detail({
    "ID": ruleset.id,
    "Name": ruleset.name,
    "Phase": ruleset.phase ?? phase,
    "Kind": ruleset.kind,
    "Version": ruleset.version ?? "",
    "Last Updated": ruleset.last_updated ?? "",
    "Rules": ruleset.rules?.length ?? 0,
  });

  if (ruleset.rules && ruleset.rules.length > 0) {
    ctx.output.json(ruleset.rules);
  }
}
