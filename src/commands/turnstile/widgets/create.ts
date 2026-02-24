import type { Context, TurnstileWidget } from "../../../types/index.js";
import { parseArgs, getStringFlag, getListFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <name> is required.");

  const domain = getStringFlag(flags, "domain");
  const domains = getListFlag(flags, "domains");
  const domainList = domains ?? (domain ? [domain] : []);
  if (domainList.length === 0) throw new UsageError("--domain <domain> or --domains <d1,d2> is required.");

  const mode = getStringFlag(flags, "mode");
  if (!mode) throw new UsageError("--mode <mode> is required (managed, non-interactive, invisible).");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = {
    name,
    domains: domainList,
    mode,
  };

  const result = await ctx.client.post<TurnstileWidget>(
    `/accounts/${encodeURIComponent(accountId)}/challenges/widgets`,
    body,
  );

  ctx.output.success(`Widget "${result.name}" created (sitekey: ${result.sitekey}).`);
}
