import type { Context, MagicIPsecTunnel } from "../../../types/index.js";
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

  const result = await ctx.client.get<{ ipsec_tunnel: MagicIPsecTunnel }>(
    `/accounts/${encodeURIComponent(accountId)}/magic/ipsec_tunnels/${encodeURIComponent(id)}`,
  );

  const tunnel = result.ipsec_tunnel;

  ctx.output.detail({
    "ID": tunnel.id,
    "Name": tunnel.name,
    "Customer Endpoint": tunnel.customer_endpoint,
    "Cloudflare Endpoint": tunnel.cloudflare_endpoint,
    "Interface Address": tunnel.interface_address,
    "Description": tunnel.description ?? "",
    "Allow Null Cipher": tunnel.allow_null_cipher ?? false,
    "Replay Protection": tunnel.replay_protection ?? false,
    "Created": tunnel.created_on ?? "",
    "Modified": tunnel.modified_on ?? "",
  });
}
