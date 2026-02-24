import type { Context, IntelWHOIS } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const domain = getStringFlag(flags, "domain");
  if (!domain) throw new UsageError("--domain <example.com> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.get<IntelWHOIS>(
    `/accounts/${encodeURIComponent(accountId)}/intel/whois`,
    { domain },
  );

  ctx.output.json(result);
}
