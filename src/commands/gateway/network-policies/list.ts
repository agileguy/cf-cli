import type { Context, GatewayPolicy, ColumnDef } from "../../../types/index.js";
import { resolveGatewayScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath } = await resolveGatewayScope(args, ctx);

  const policies = await ctx.client.get<GatewayPolicy[]>(
    `${basePath}/rules`,
  );

  // Filter to network type policies (filters contains "l4")
  const networkPolicies = policies.filter(
    (p) => p.filters?.includes("l4") ?? false,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 38 },
    { key: "name", header: "Name", width: 30 },
    { key: "action", header: "Action", width: 12 },
    { key: "precedence", header: "Precedence", width: 10 },
    {
      key: "enabled",
      header: "Enabled",
      width: 8,
      transform: (v: unknown) => v ? "yes" : "no",
    },
    {
      key: "created_at",
      header: "Created",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "",
    },
  ];

  ctx.output.table(networkPolicies, columns);
}
