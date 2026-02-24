import type { Context, Ruleset, ColumnDef } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";
import { resolveScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveScope(args, ctx);

  const rulesetId = getStringFlag(flags, "ruleset");

  if (!rulesetId) throw new UsageError("--ruleset <ruleset-id> is required.");

  const versions = await ctx.client.get<Ruleset[]>(
    `${basePath}/${encodeURIComponent(rulesetId)}/versions`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "version", header: "Version", width: 10 },
    { key: "name", header: "Name", width: 30 },
    {
      key: "last_updated",
      header: "Updated",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "",
    },
  ];

  ctx.output.table(versions, columns);
}
