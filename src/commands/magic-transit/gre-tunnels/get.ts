import type { Context, MagicGRETunnel } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <tunnel-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.get<{ gre_tunnel: MagicGRETunnel }>(
    `/accounts/${encodeURIComponent(accountId)}/magic/gre_tunnels/${encodeURIComponent(id)}`,
  );

  const tunnel = result.gre_tunnel;

  ctx.output.detail({
    "ID": tunnel.id,
    "Name": tunnel.name,
    "Customer Endpoint": tunnel.customer_gre_endpoint,
    "Cloudflare Endpoint": tunnel.cloudflare_gre_endpoint,
    "Interface Address": tunnel.interface_address,
    "Description": tunnel.description ?? "",
    "TTL": tunnel.ttl ?? "",
    "MTU": tunnel.mtu ?? "",
    "Created": tunnel.created_on ?? "",
    "Modified": tunnel.modified_on ?? "",
  });
}
