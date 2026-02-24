import type { Context, AccessServiceToken, ColumnDef } from "../../../types/index.js";
import { resolveAccountScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath } = await resolveAccountScope(args, ctx);

  const tokens = await ctx.client.get<AccessServiceToken[]>(
    `${basePath}/service_tokens`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 38 },
    { key: "name", header: "Name", width: 24 },
    { key: "client_id", header: "Client ID", width: 34 },
    {
      key: "expires_at",
      header: "Expires",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "never",
    },
    {
      key: "created_at",
      header: "Created",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "",
    },
  ];

  ctx.output.table(tokens, columns);
}
