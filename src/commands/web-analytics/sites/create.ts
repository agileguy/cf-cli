import type { Context, WebAnalyticsSite } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const host = getStringFlag(flags, "host");
  if (!host) throw new UsageError("--host <hostname> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = { host, auto_install: true };

  const site = await ctx.client.post<WebAnalyticsSite>(
    `/accounts/${encodeURIComponent(accountId)}/rum/site_info`,
    body,
  );

  ctx.output.success(`Web Analytics site created (tag: ${site.site_tag}).`);
  ctx.output.detail({
    "Site Tag": site.site_tag,
    "Host": site.host ?? "",
    "Snippet": site.snippet ?? "",
  });
}
