import type { Context, CfdTunnel } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <tunnel-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = {};
  const name = getStringFlag(flags, "name");
  if (name) body["name"] = name;

  const tunnel = await ctx.client.patch<CfdTunnel>(
    `/accounts/${encodeURIComponent(accountId)}/cfd_tunnel/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Tunnel "${tunnel.name}" updated.`);
  ctx.output.detail({
    "ID": tunnel.id,
    "Name": tunnel.name,
    "Status": tunnel.status,
  });
}
