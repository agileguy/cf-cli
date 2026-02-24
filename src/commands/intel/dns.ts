import type { Context, IntelDNS } from "../../types/index.js";
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

  const paramKey = ip.includes(":") ? "ipv6" : "ipv4";

  const result = await ctx.client.get<IntelDNS>(
    `/accounts/${encodeURIComponent(accountId)}/intel/dns`,
    { [paramKey]: ip },
  );

  ctx.output.json(result);
}
