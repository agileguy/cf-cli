import type { Context, Ruleset, ColumnDef } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";
import { resolveScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveScope(args, ctx);

  // List all rulesets -- phases are rulesets with kind "zone" or "managed"
  const rulesets = await ctx.client.get<Ruleset[]>(basePath);

  // Filter to only phase entrypoint rulesets
  const phaseRulesets = rulesets.filter((r) => r.phase);

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "phase", header: "Phase", width: 40 },
    { key: "name", header: "Name", width: 24 },
    { key: "kind", header: "Kind", width: 12 },
    { key: "version", header: "Version", width: 8 },
  ];

  ctx.output.table(phaseRulesets, columns);
}
