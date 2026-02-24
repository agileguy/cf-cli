import type { Context, Ruleset, RulesetRule, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const accountId = getStringFlag(flags, "accountId");
  const rulesetId = getStringFlag(flags, "ruleset");

  if (!zone && !accountId) throw new UsageError("--zone <zone> or --account-id <id> is required.");
  if (zone && accountId) throw new UsageError("Specify either --zone or --account-id, not both.");
  if (!rulesetId) throw new UsageError("--ruleset <ruleset-id> is required.");

  let basePath: string;
  if (zone) {
    const zoneId = await resolveZoneId(zone, ctx.client);
    basePath = `/zones/${encodeURIComponent(zoneId)}/rulesets`;
  } else {
    basePath = `/accounts/${encodeURIComponent(accountId!)}/rulesets`;
  }

  const ruleset = await ctx.client.get<Ruleset>(
    `${basePath}/${encodeURIComponent(rulesetId)}`,
  );

  const rules: RulesetRule[] = ruleset.rules ?? [];

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "action", header: "Action", width: 14 },
    { key: "expression", header: "Expression", width: 40 },
    { key: "description", header: "Description", width: 24 },
    {
      key: "enabled",
      header: "Enabled",
      width: 8,
      transform: (v: unknown) => v === false ? "No" : "Yes",
    },
  ];

  ctx.output.table(rules, columns);
}
