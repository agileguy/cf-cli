import type { Context, WARPSettings } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const settings = await ctx.client.get<WARPSettings>(
    `/accounts/${encodeURIComponent(accountId)}/devices/settings`,
  );

  ctx.output.json(settings);
}
