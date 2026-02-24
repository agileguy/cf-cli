import type { Context, Ruleset, ColumnDef } from "../../types/index.js";
import { resolveScope } from "./scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath } = await resolveScope(args, ctx);

  const rulesets = await ctx.client.get<Ruleset[]>(basePath);

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "name", header: "Name", width: 30 },
    { key: "kind", header: "Kind", width: 12 },
    { key: "phase", header: "Phase", width: 30 },
    { key: "version", header: "Version", width: 8 },
    {
      key: "last_updated",
      header: "Updated",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "",
    },
  ];

  ctx.output.table(rulesets, columns);
}
