import type { Context, MagicIPsecTunnel, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.get<{ ipsec_tunnels: MagicIPsecTunnel[] }>(
    `/accounts/${encodeURIComponent(accountId)}/magic/ipsec_tunnels`,
  );

  const tunnels = result.ipsec_tunnels ?? [];

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 25 },
    { key: "customer_endpoint", header: "Customer Endpoint", width: 18 },
    { key: "cloudflare_endpoint", header: "CF Endpoint", width: 18 },
    { key: "interface_address", header: "Interface", width: 18 },
  ];

  ctx.output.table(tunnels as unknown as Record<string, unknown>[], columns);
}
