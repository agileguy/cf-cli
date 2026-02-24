import type { Context, CFImageStats } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const stats = await ctx.client.get<CFImageStats>(
    `/accounts/${encodeURIComponent(accountId)}/images/v1/stats`,
  );

  ctx.output.detail({
    "Current Count": stats.count?.current ?? "-",
    "Allowed Count": stats.count?.allowed ?? "-",
  });
}
