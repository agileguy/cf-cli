import type { Context, GatewayPolicy, ColumnDef } from "../../../types/index.js";
import { resolveGatewayScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath } = await resolveGatewayScope(args, ctx);

  // Note: the Gateway rules API does not support server-side filter or pagination
  // query parameters. All rules are fetched and filtered client-side.
  const policies = await ctx.client.get<GatewayPolicy[]>(
    `${basePath}/rules`,
  );

  // Filter to DNS type policies (filters contains "dns")
  const dnsPolicies = policies.filter(
    (p) => p.filters?.includes("dns") ?? false,
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

  ctx.output.table(dnsPolicies, columns);
}
