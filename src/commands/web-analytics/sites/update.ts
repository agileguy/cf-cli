import type { Context, WebAnalyticsSite } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <site-tag> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = {};

  const host = getStringFlag(flags, "host");
  if (host) body.host = host;

  const site = await ctx.client.put<WebAnalyticsSite>(
    `/accounts/${encodeURIComponent(accountId)}/rum/site_info/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Web Analytics site "${id}" updated.`);
  ctx.output.detail({
    "Site Tag": site.site_tag,
    "Host": site.host ?? "",
  });
}
