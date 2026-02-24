import type { Context, Ruleset, RulesetRule, ColumnDef } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";
import { resolveScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveScope(args, ctx);

  const rulesetId = getStringFlag(flags, "ruleset");

  if (!rulesetId) throw new UsageError("--ruleset <ruleset-id> is required.");

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
