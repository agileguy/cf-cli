import type { Context, GatewayDLPProfile, ColumnDef } from "../../../types/index.js";
import { resolveGatewayScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { accountId } = await resolveGatewayScope(args, ctx);

  const profiles = await ctx.client.get<GatewayDLPProfile[]>(
    `/accounts/${encodeURIComponent(accountId)}/dlp/profiles`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 38 },
    { key: "name", header: "Name", width: 30 },
    { key: "type", header: "Type", width: 12 },
    {
      key: "entries",
      header: "Entries",
      width: 8,
      transform: (v: unknown) => Array.isArray(v) ? String(v.length) : "0",
    },
    {
      key: "created_at",
      header: "Created",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "",
    },
  ];

  ctx.output.table(profiles, columns);
}
