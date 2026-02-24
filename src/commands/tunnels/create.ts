import type { Context, CfdTunnel } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <tunnel-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const tunnel = await ctx.client.post<CfdTunnel>(
    `/accounts/${encodeURIComponent(accountId)}/cfd_tunnel`,
    { name, tunnel_secret: btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))) },
  );

  ctx.output.success(`Tunnel "${tunnel.name}" created.`);
  ctx.output.detail({
    "ID": tunnel.id,
    "Name": tunnel.name,
    "Status": tunnel.status,
    "Created": tunnel.created_at,
  });
}
