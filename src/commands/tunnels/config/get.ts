import type { Context, CfdTunnelConfig } from "../../../types/index.js";
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

  const config = await ctx.client.get<CfdTunnelConfig>(
    `/accounts/${encodeURIComponent(accountId)}/cfd_tunnel/${encodeURIComponent(id)}/configurations`,
  );

  ctx.output.json(config);
}
