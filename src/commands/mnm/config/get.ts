import type { Context, MNMConfig } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const config = await ctx.client.get<MNMConfig>(
    `/accounts/${encodeURIComponent(accountId)}/mnm/config`,
  );

  ctx.output.json(config);
}
