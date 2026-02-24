import type { Context, RegistrarDomain } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const domain = getStringFlag(flags, "domain");
  if (!domain) throw new UsageError("--domain <domain-name> is required.");

  const reg = await ctx.client.post<RegistrarDomain>(
    `/accounts/${encodeURIComponent(accountId)}/registrar/domains/${encodeURIComponent(domain)}/transfer-in`,
  );

  ctx.output.success(`Transfer initiated for "${domain}".`);
  ctx.output.detail({
    "Name": reg.name,
    "Status": reg.status,
  });
}
