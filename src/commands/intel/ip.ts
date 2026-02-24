import type { Context, IntelIP } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const ip = getStringFlag(flags, "ip");
  if (!ip) throw new UsageError("--ip <address> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  // Detect IPv6 by presence of colon
  const paramKey = ip.includes(":") ? "ipv6" : "ipv4";

  const result = await ctx.client.get<IntelIP>(
    `/accounts/${encodeURIComponent(accountId)}/intel/ip`,
    { [paramKey]: ip },
  );

  ctx.output.json(result);
}
