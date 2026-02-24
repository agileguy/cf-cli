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

  const description = getStringFlag(flags, "description");

  // Get current entries, add the new one, PUT the full list back
  const current = await ctx.client.get<SplitTunnelEntry[]>(
    `/accounts/${encodeURIComponent(accountId)}/devices/policy/exclude`,
  );

  const existing = Array.isArray(current) ? current : [];
  if (existing.some((e) => e.address === address)) {
    ctx.output.warn(`Split tunnel entry "${address}" already exists.`);
    return;
  }

  const entry: SplitTunnelEntry = { address };
  if (description) entry.description = description;

  const updated = [...existing, entry];

  await ctx.client.put<SplitTunnelEntry[]>(
    `/accounts/${encodeURIComponent(accountId)}/devices/policy/exclude`,
    updated,
  );

  ctx.output.success(`Split tunnel entry "${address}" added.`);
}
