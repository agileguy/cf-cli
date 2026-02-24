import type { Context, WebAnalyticsSite } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const sites = await ctx.client.get<WebAnalyticsSite[]>(
    `/accounts/${encodeURIComponent(accountId)}/rum/site_info/list`,
  );
  const list = Array.isArray(sites) ? sites : [];

  ctx.output.table(list, [
    { key: "site_tag", header: "Site Tag" },
    { key: "host", header: "Host" },
    { key: "auto_install", header: "Auto Install" },
    { key: "created", header: "Created" },
  ]);
}
