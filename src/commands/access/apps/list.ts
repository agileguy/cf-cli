import type { Context, AccessApplication, ColumnDef } from "../../../types/index.js";
import { resolveScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath } = await resolveScope(args, ctx);

  const apps = await ctx.client.get<AccessApplication[]>(
    `${basePath}/apps`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 38 },
    { key: "name", header: "Name", width: 30 },
    { key: "domain", header: "Domain", width: 30 },
    { key: "type", header: "Type", width: 16 },
    {
      key: "created_at",
      header: "Created",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "",
    },
  ];

  ctx.output.table(apps, columns);
}
