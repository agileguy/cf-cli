import type { Context, SplitTunnelEntry } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const address = getStringFlag(flags, "address");
  if (!address) throw new UsageError("--address <cidr> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  // Get current entries, remove the matching one, PUT the full list back
  const current = await ctx.client.get<SplitTunnelEntry[]>(
    `/accounts/${encodeURIComponent(accountId)}/devices/policy/exclude`,
  );

  const entries = Array.isArray(current) ? current : [];
  const updated = entries.filter((e) => e.address !== address);

  if (updated.length === entries.length) {
    throw new UsageError(`Split tunnel entry "${address}" not found.`);
  }

  await ctx.client.put<SplitTunnelEntry[]>(
    `/accounts/${encodeURIComponent(accountId)}/devices/policy/exclude`,
    updated,
  );

  ctx.output.success(`Split tunnel entry "${address}" removed.`);
}
