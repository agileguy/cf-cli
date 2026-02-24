import type { Context, AccessGroup, ColumnDef } from "../../../types/index.js";
import { resolveAccountScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath } = await resolveAccountScope(args, ctx);

  const groups = await ctx.client.get<AccessGroup[]>(
    `${basePath}/groups`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 38 },
    { key: "name", header: "Name", width: 30 },
    {
      key: "include",
      header: "Include Rules",
      width: 14,
      transform: (v: unknown) => Array.isArray(v) ? String(v.length) : "0",
    },
    {
      key: "created_at",
      header: "Created",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "",
    },
  ];

  ctx.output.table(groups, columns);
}
