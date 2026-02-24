import type { Context, AccessIdentityProvider, ColumnDef } from "../../../types/index.js";
import { resolveAccountScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath } = await resolveAccountScope(args, ctx);

  const idps = await ctx.client.get<AccessIdentityProvider[]>(
    `${basePath}/identity_providers`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 38 },
    { key: "name", header: "Name", width: 30 },
    { key: "type", header: "Type", width: 20 },
    {
      key: "created_at",
      header: "Created",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "",
    },
  ];

  ctx.output.table(idps, columns);
}
