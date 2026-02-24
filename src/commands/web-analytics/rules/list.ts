import type { Context, WebAnalyticsRule } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const site = getStringFlag(flags, "site");
  if (!site) throw new UsageError("--site <site-tag> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const rules = await ctx.client.get<WebAnalyticsRule[]>(
    `/accounts/${encodeURIComponent(accountId)}/rum/v2/${encodeURIComponent(site)}/rules`,
  );
  const list = Array.isArray(rules) ? rules : [];

  ctx.output.table(list, [
    { key: "id", header: "ID" },
    { key: "host", header: "Host" },
    { key: "paths", header: "Paths" },
    { key: "inclusive", header: "Inclusive" },
    { key: "is_paused", header: "Paused" },
    { key: "created", header: "Created" },
  ]);
}
